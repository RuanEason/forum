interface UserStatsProps {
  daysJoined: number;
  postsPublished: number;
  totalViews: number;
  likesReceived: number;
  likesGiven: number;
}

export default function UserStats({
  daysJoined,
  postsPublished,
  totalViews,
  likesReceived,
  likesGiven,
}: UserStatsProps) {
  const stats = [
    { label: "加入天数", value: daysJoined },
    { label: "发布帖子", value: postsPublished },
    { label: "被浏览量", value: totalViews },
    { label: "获得点赞", value: likesReceived },
    { label: "送出点赞", value: likesGiven },
  ];

  // 格式化数字，超过 1000 显示 k
  const formatNumber = (num: number): string => {
    if (num >= 10000) {
      return (num / 10000).toFixed(1).replace(/\.0$/, "") + "w";
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1).replace(/\.0$/, "") + "k";
    }
    return num.toString();
  };

  return (
    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg mb-6 border-b sm:border-0 border-gray-200">
      <div className="p-4 sm:p-6">
        <h3 className="text-sm font-medium text-gray-500 mb-4">用户统计</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="text-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="text-2xl sm:text-3xl font-bold text-gray-900">
                {formatNumber(stat.value)}
              </div>
              <div className="text-xs sm:text-sm text-gray-500 mt-1">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
