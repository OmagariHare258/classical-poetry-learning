import React, { useState } from 'react';
import { Star, MessageCircle } from 'lucide-react';

interface RatingComponentProps {
  poemId: number;
  onRatingSubmit: (rating: {
    content_rating: number;
    image_rating: number;
    overall_rating: number;
    comment?: string;
  }) => void;
  initialRating?: {
    content_rating: number;
    image_rating: number;
    overall_rating: number;
    comment?: string;
  };
}

export const RatingComponent: React.FC<RatingComponentProps> = ({
  poemId,
  onRatingSubmit,
  initialRating
}) => {
  const [contentRating, setContentRating] = useState(initialRating?.content_rating || 0);
  const [imageRating, setImageRating] = useState(initialRating?.image_rating || 0);
  const [overallRating, setOverallRating] = useState(initialRating?.overall_rating || 0);
  const [comment, setComment] = useState(initialRating?.comment || '');
  const [showCommentBox, setShowCommentBox] = useState(false);

  const renderStars = (
    rating: number,
    setRating: (value: number) => void,
    color: string = 'text-yellow-400'
  ) => {
    return Array.from({ length: 5 }, (_, index) => {
      const starValue = index + 1;
      return (
        <Star
          key={index}
          className={`w-6 h-6 cursor-pointer transition-colors ${
            starValue <= rating 
              ? `${color} fill-current` 
              : 'text-gray-300 hover:text-gray-400'
          }`}
          onClick={() => setRating(starValue)}
          onMouseEnter={() => {}}
        />
      );
    });
  };

  const handleSubmit = () => {
    if (contentRating === 0 || imageRating === 0 || overallRating === 0) {
      alert('请完成所有评分');
      return;
    }

    onRatingSubmit({
      content_rating: contentRating,
      image_rating: imageRating,
      overall_rating: overallRating,
      comment: comment.trim() || undefined
    });
  };

  const getRatingText = (rating: number): string => {
    const texts = ['', '很差', '较差', '一般', '不错', '很好'];
    return texts[rating] || '';
  };

  const getRatingColor = (rating: number): string => {
    if (rating >= 4) return 'text-green-500';
    if (rating >= 3) return 'text-yellow-500';
    if (rating >= 2) return 'text-orange-500';
    return 'text-red-500';
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
      <h3 className="text-xl font-bold text-gray-800 mb-6 text-center">
        为这首诗词评分
      </h3>

      {/* 内容评分 */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700">
            诗词内容
          </label>
          <span className={`text-sm font-medium ${getRatingColor(contentRating)}`}>
            {getRatingText(contentRating)}
          </span>
        </div>
        <div className="flex space-x-1">
          {renderStars(contentRating, setContentRating, 'text-blue-500')}
        </div>
      </div>

      {/* 图片评分 */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700">
            配图质量
          </label>
          <span className={`text-sm font-medium ${getRatingColor(imageRating)}`}>
            {getRatingText(imageRating)}
          </span>
        </div>
        <div className="flex space-x-1">
          {renderStars(imageRating, setImageRating, 'text-purple-500')}
        </div>
      </div>

      {/* 整体评分 */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700">
            整体体验
          </label>
          <span className={`text-sm font-medium ${getRatingColor(overallRating)}`}>
            {getRatingText(overallRating)}
          </span>
        </div>
        <div className="flex space-x-1">
          {renderStars(overallRating, setOverallRating, 'text-yellow-500')}
        </div>
      </div>

      {/* 评论输入 */}
      <div className="mb-6">
        <button
          onClick={() => setShowCommentBox(!showCommentBox)}
          className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
        >
          <MessageCircle className="w-4 h-4" />
          <span>{showCommentBox ? '收起评论' : '添加评论'}</span>
        </button>
        
        {showCommentBox && (
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="分享你的学习感受..."
            className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows={3}
            maxLength={200}
          />
        )}
      </div>

      {/* 提交按钮 */}
      <button
        onClick={handleSubmit}
        disabled={contentRating === 0 || imageRating === 0 || overallRating === 0}
        className={`w-full py-2 px-4 rounded-md font-medium transition-colors ${
          contentRating > 0 && imageRating > 0 && overallRating > 0
            ? 'bg-blue-600 hover:bg-blue-700 text-white'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        }`}
      >
        提交评分
      </button>
    </div>
  );
};

// 评分显示组件
interface RatingDisplayProps {
  ratings: {
    average_content: number;
    average_image: number;
    average_overall: number;
    total_ratings: number;
  };
  compact?: boolean;
}

export const RatingDisplay: React.FC<RatingDisplayProps> = ({ 
  ratings, 
  compact = false 
}) => {
  const renderStarDisplay = (rating: number, color: string = 'text-yellow-400') => {
    return Array.from({ length: 5 }, (_, index) => {
      const starValue = index + 1;
      const isHalf = rating >= starValue - 0.5 && rating < starValue;
      
      return (
        <div key={index} className="relative">
          <Star
            className={`w-4 h-4 ${
              starValue <= rating 
                ? `${color} fill-current` 
                : 'text-gray-300'
            }`}
          />
          {isHalf && (
            <Star
              className={`w-4 h-4 absolute top-0 left-0 ${color} fill-current`}
              style={{ clipPath: 'inset(0 50% 0 0)' }}
            />
          )}
        </div>
      );
    });
  };

  if (compact) {
    return (
      <div className="flex items-center space-x-2 text-sm">
        <div className="flex">
          {renderStarDisplay(ratings.average_overall)}
        </div>
        <span className="text-gray-600">
          {ratings.average_overall.toFixed(1)} ({ratings.total_ratings}条评价)
        </span>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <h4 className="font-medium text-gray-800 mb-3">学习者评价</h4>
      
      <div className="grid grid-cols-1 gap-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">诗词内容</span>
          <div className="flex items-center space-x-2">
            <div className="flex">
              {renderStarDisplay(ratings.average_content, 'text-blue-500')}
            </div>
            <span className="text-sm font-medium">
              {ratings.average_content.toFixed(1)}
            </span>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">配图质量</span>
          <div className="flex items-center space-x-2">
            <div className="flex">
              {renderStarDisplay(ratings.average_image, 'text-purple-500')}
            </div>
            <span className="text-sm font-medium">
              {ratings.average_image.toFixed(1)}
            </span>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">整体体验</span>
          <div className="flex items-center space-x-2">
            <div className="flex">
              {renderStarDisplay(ratings.average_overall, 'text-yellow-500')}
            </div>
            <span className="text-sm font-medium">
              {ratings.average_overall.toFixed(1)}
            </span>
          </div>
        </div>
      </div>
      
      <div className="mt-3 text-xs text-gray-500 text-center">
        基于 {ratings.total_ratings} 条评价
      </div>
    </div>
  );
};
