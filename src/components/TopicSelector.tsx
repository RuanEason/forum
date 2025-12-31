"use client";

import { useState, useEffect, useRef } from "react";

interface Topic {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  _count?: {
    posts: number;
  };
}

interface TopicSelectorProps {
  selectedTopicId: string | null;
  onSelect: (topicId: string | null) => void;
}

export default function TopicSelector({
  selectedTopicId,
  onSelect,
}: TopicSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [selectedTopicName, setSelectedTopicName] = useState<string | null>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  // Fetch topics whenever the search term or drawer open state changes
  useEffect(() => {
    if (!isOpen) return;

    const fetchTopics = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/topic?q=${searchTerm}`);
        if (res.ok) {
          const data = await res.json();
          setTopics(data);
        }
      } catch (error) {
        console.error("Failed to fetch topics", error);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(() => {
      fetchTopics();
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, isOpen]);

  // Fetch the selected topic's details on mount or when selectedTopicId changes
  useEffect(() => {
      if (selectedTopicId) {
          // Ideally we would fetch the single topic details if we don't have it
          // For now, if we have it in our list, use it. If not, maybe fetch?
          // Let's do a quick fetch if we don't have the name
          if (!selectedTopicName) {
             fetch(`/api/topic?id=${selectedTopicId}`).then(res => {
                 if (res.ok) return res.json();
             }).then(data => {
                 if (Array.isArray(data) && data.length > 0) {
                      // If the API returns an array (search), we might need a specific endpoint for ID or filter results
                      // Our current API only supports search by query 'q'
                      // Let's assume for now if it's in the 'topics' list we use that, otherwise we might just need to rely on the parent or improved API
                      // Update: Since our API is simple search, let's just search by name? No, ID is safer.
                      // Let's iterate topics if available.
                      const found = data.find((t: Topic) => t.id === selectedTopicId);
                      if (found) setSelectedTopicName(found.name);
                 }
             });
          }
      } else {
          setSelectedTopicName(null);
      }
  }, [selectedTopicId]);

    // Update selected topic name when topics list updates and we find a match
    useEffect(() => {
        if (selectedTopicId && topics.length > 0) {
            const found = topics.find(t => t.id === selectedTopicId);
            if (found) setSelectedTopicName(found.name);
        }
    }, [topics, selectedTopicId]);


  // Close drawer when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        // If clicking on the overlay (which covers everything outside the drawer)
        const overlay = document.getElementById("topic-drawer-overlay");
        if (overlay && overlay.contains(event.target as Node) && !drawerRef.current?.contains(event.target as Node)) {
             setIsOpen(false);
        }
    };

    if (isOpen) {
        document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleCreateTopic = async () => {
    if (!searchTerm.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/topic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: searchTerm.trim() }),
      });

      if (res.ok) {
        const newTopic = await res.json();
        onSelect(newTopic.id);
        setSelectedTopicName(newTopic.name);
        setIsOpen(false);
        setSearchTerm("");
      }
    } catch (error) {
      console.error("Failed to create topic", error);
    } finally {
      setCreating(false);
    }
  };
  
  const handleSelectTopic = (topic: Topic) => {
      onSelect(topic.id);
      setSelectedTopicName(topic.name);
      setIsOpen(false);
      setSearchTerm("");
  };

  const handleClearSelection = (e: React.MouseEvent) => {
      e.stopPropagation();
      onSelect(null);
      setSelectedTopicName(null);
  };

  return (
    <>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`group relative inline-flex items-center px-4 py-2 text-sm font-medium border rounded-full transition-all duration-200 ease-in-out ${
          selectedTopicId
            ? "bg-sky-50 text-sky-600 border-sky-200 hover:bg-sky-100 pr-9" // Added right padding for the 'x' button
            : "bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700"
        }`}
      >
        <span className="flex items-center">
            {selectedTopicId ? (
                <>
                    <span className="mr-1">#</span>
                    {selectedTopicName || "话题"}
                </>
            ) : (
                <>
                     {/* Search Icon */}
                    # 选择话题
                </>
            )}
        </span>
        
        {/* 'x' button to deselect, visible only when a topic is selected */}
        {selectedTopicId && (
            <span 
                onClick={handleClearSelection}
                className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 text-sky-400 hover:text-sky-600 rounded-full hover:bg-sky-200 cursor-pointer"
            >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 3L3 9M3 3L9 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
            </span>
        )}
      </button>

      {/* Drawer Overlay */}
      <div 
        id="topic-drawer-overlay"
        className={`topic-drawer-overlay ${isOpen ? "open" : ""}`} 
        aria-hidden="true"
      />

      {/* Slide-out Drawer */}
      <div ref={drawerRef} className={`topic-drawer ${isOpen ? "open" : ""}`}>
         {/* Drawer Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
           <div className="flex items-center gap-2 text-gray-800 font-medium">
             <span className="text-lg">选择话题</span>
           </div>
           <button 
             onClick={() => setIsOpen(false)}
             className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
            >
             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6L6 18M6 6l12 12"></path>
             </svg>
           </button>
        </div>

         {/* Search Input */}
        <div className="p-4 border-b border-gray-100">
          <div className="relative">
            <span className="absolute inset-y-0 left-3 flex items-center text-gray-400">
               <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
               </svg>
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="搜索话题"
              className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 border border-transparent rounded-lg focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors outline-none"
              autoFocus={isOpen}
            />
          </div>
        </div>

        {/* Topic List */}
        <div className="flex-1 overflow-y-auto">
            {loading ? (
                <div className="p-8 text-center text-gray-400 text-sm">
                    加载中...
                </div>
            ) : topics.length > 0 ? (
                <ul className="divide-y divide-gray-50">
                    {topics.map((topic) => (
                        <li key={topic.id}>
                            <button
                                type="button"
                                onClick={() => handleSelectTopic(topic)}
                                className={`w-full px-5 py-3 text-left hover:bg-gray-50 flex items-center justify-between transition-colors ${
                                    selectedTopicId === topic.id ? "bg-indigo-50 text-indigo-700" : "text-gray-700"
                                }`}
                            >
                                <span className="font-medium">#{topic.name}</span>
                                {topic._count && (
                                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                                        {topic._count.posts} 帖子
                                    </span>
                                )}
                            </button>
                        </li>
                    ))}
                </ul>
            ) : searchTerm ? (
                <div className="p-4">
                     <div className="text-center text-gray-500 text-sm mb-4">
                        未找到与 "{searchTerm}" 相关的话题
                     </div>
                     <button
                        type="button"
                        onClick={handleCreateTopic}
                        disabled={creating}
                        className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2"
                     >
                        {creating ? (
                            <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
                        ) : (
                             <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                             </svg>
                        )}
                        创建 "{searchTerm}" 话题
                     </button>
                </div>
            ) : (
                <div className="p-8 text-center">
                    <div className="text-gray-300 mb-2">
                        <svg className="w-12 h-12 mx-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                           <path strokeLinecap="round" strokeLinejoin="round" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                        </svg>
                    </div>
                    <p className="text-gray-500 text-sm">输入关键词搜索或创建新话题</p>
                </div>
            )}
        </div>
      </div>
    </>
  );
}
