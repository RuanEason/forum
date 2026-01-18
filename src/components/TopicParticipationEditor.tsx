"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import SimpleMarkdownEditor from "@/components/SimpleMarkdownEditor";

// SVG Icons
const Icons = {
    Image: ({ className }: { className?: string }) => (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
            <circle cx="9" cy="9" r="2" />
            <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
        </svg>
    ),
    X: ({ className }: { className?: string }) => (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M18 6 6 18" />
            <path d="m6 6 18 18" />
        </svg>
    ),
    Send: ({ className }: { className?: string }) => (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="m22 2-7 20-4-9-9-4Z" />
            <path d="M22 2 11 13" />
        </svg>
    ),
    Plus: ({ className }: { className?: string }) => (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M5 12h14" />
            <path d="M12 5v14" />
        </svg>
    ),
    Pen: ({ className }: { className?: string }) => (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
        </svg>
    )
};

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

const Button = ({
    children,
    onClick,
    disabled,
    className = "",
    variant = 'primary',
    size = 'md'
}: ButtonProps) => {
    const baseStyle = "inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
    
    const variants = {
        primary: "bg-blue-600 text-white hover:bg-blue-700 shadow-sm focus:ring-blue-500 border border-transparent",
        secondary: "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 shadow-sm focus:ring-gray-500",
        ghost: "bg-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900",
        danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500"
    };

    const sizes = {
        sm: "text-xs px-3 py-1.5 rounded-md",
        md: "text-sm px-4 py-2 rounded-lg",
        lg: "text-base px-6 py-3 rounded-lg"
    };

    return (
        <button 
            onClick={onClick} 
            disabled={disabled} 
            className={`${baseStyle} ${variants[variant as keyof typeof variants]} ${sizes[size as keyof typeof sizes]} ${className}`}
        >
            {children}
        </button>
    );
};

interface Topic {
    id: string;
    name: string;
}

interface TopicParticipationEditorProps {
    topic: Topic;
    onPostSuccess?: () => void;
}

export default function TopicParticipationEditor({ topic, onPostSuccess }: TopicParticipationEditorProps) {
    const { data: session } = useSession();
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [content, setContent] = useState("");
    const [title, setTitle] = useState("");
    const [images, setImages] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Close modal on escape key
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setIsOpen(false);
        };
        if (isOpen) window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen]);

    if (!session) {
        return (
            <Button onClick={() => router.push("/auth/signin")} variant="primary" className="shadow-md hover:shadow-lg transform transition-transform active:scale-95">
                <Icons.Pen className="w-4 h-4 mr-2" />
                参与讨论
            </Button>
        );
    }

    if (!isOpen) {
        return (
            <Button onClick={() => setIsOpen(true)} variant="primary" className="shadow-md hover:shadow-lg transform transition-transform active:scale-95">
                 <Icons.Pen className="w-4 h-4 mr-2" />
                参与讨论
            </Button>
        );
    }

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
    
        const file = e.target.files[0];
        const formData = new FormData();
        formData.append("file", file);
    
        try {
            // Show loading state for image if needed, or just append after load
            const res = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            });
    
            if (!res.ok) throw new Error("上传失败");
    
            const data = await res.json();
            setImages([...images, data.url]);
        } catch (error) {
            console.error("Upload error:", error);
            alert("图片上传失败");
        }
        
        // Reset input
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSubmit = async () => {
        if (!content.trim() && images.length === 0) return;

        setIsSubmitting(true);
        try {
            const res = await fetch("/api/post", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    title,
                    content,
                    topicId: topic.id,
                    images,
                    type: images.length > 0 ? "image" : "text",
                }),
            });

            if (res.ok) {
                setContent("");
                setTitle("");
                setImages([]);
                setIsOpen(false);
                router.refresh();
                if (onPostSuccess) {
                    onPostSuccess();
                }
            } else {
                alert("发布失败");
            }
        } catch (error) {
            console.error("Post error:", error);
            alert("发生错误");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <div 
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
                onClick={() => setIsOpen(false)}
            />
            
            <div className="relative bg-white dark:bg-zinc-900 w-full max-w-2xl rounded-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md z-10">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">参与讨论</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">#{topic.name}</p>
                    </div>
                    <button 
                        onClick={() => setIsOpen(false)}
                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                    >
                        <Icons.X className="w-5 h-5" />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-5">
                    {/* Title Input */}
                    <input
                        type="text"
                        placeholder="请输入标题（可选）"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full text-lg font-semibold px-4 py-3 bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder:text-gray-400"
                    />

                    {/* Markdown Editor */}
                    <div className="w-full border border-gray-200 dark:border-zinc-700 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500/50 focus-within:border-blue-500 transition-all shadow-sm">
                        <SimpleMarkdownEditor
                            value={content}
                            onChange={setContent}
                            placeholder="分享你的想法..."
                            minHeight={200}
                        />
                    </div>

                    {/* Image Preview Grid */}
                    {images.length > 0 && (
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 animate-in fade-in duration-300">
                            {images.map((url, index) => (
                                <div key={index} className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200 dark:border-zinc-700 shadow-sm bg-gray-100">
                                    <img src={url} alt="Uploaded" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                                    <button
                                        onClick={() => setImages(images.filter((_, i) => i !== index))}
                                        className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-600 transform hover:scale-105"
                                    >
                                        <Icons.X className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/50 flex items-center justify-between gap-4">
                    <div className="flex items-center">
                        <input
                            type="file"
                            accept="image/*"
                            ref={fileInputRef}
                            className="hidden"
                            onChange={handleImageUpload}
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-zinc-800 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg transition-colors border border-transparent hover:border-gray-200 dark:hover:border-zinc-700"
                            title="上传图片"
                        >
                            <Icons.Image className="w-5 h-5" />
                            <span className="hidden sm:inline">添加图片</span>
                        </button>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button 
                            variant="ghost" 
                            onClick={() => setIsOpen(false)}
                            disabled={isSubmitting}
                        >
                            取消
                        </Button>
                        <Button 
                            variant="primary"
                            onClick={handleSubmit} 
                            disabled={isSubmitting || (!content.trim() && images.length === 0)}
                            className="pl-3 pr-4"
                        >
                            {isSubmitting ? (
                                <span className="flex items-center gap-2">
                                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    发布中...
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    <Icons.Send className="w-4 h-4" />
                                    发布
                                </span>
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
