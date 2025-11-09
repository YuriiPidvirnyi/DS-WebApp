import React, { useState } from 'react'
import { Star, CheckCircle, XCircle, AlertCircle, Clock } from 'lucide-react'

interface Review {
  id: string
  patientName: string
  rating: number
  comment: string
  service?: string
  submittedAt: string
  status: 'pending' | 'approved' | 'rejected'
}

/**
 * Admin component for moderating patient reviews
 */
export const ReviewModeration: React.FC = () => {
  const [reviews, setReviews] = useState<Review[]>([
    {
      id: 'r1',
      patientName: 'Олена Петренко',
      rating: 5,
      comment:
        'Чудовий сервіс! Професійна команда, сучасне обладнання. Дуже задоволена результатом!',
      service: 'Відбілювання зубів',
      submittedAt: '2024-01-15T10:30:00Z',
      status: 'pending',
    },
    {
      id: 'r2',
      patientName: 'Іван Сидоренко',
      rating: 4,
      comment: 'Гарний досвід, але довго чекав на прийом',
      service: 'Професійна чистка',
      submittedAt: '2024-01-14T14:20:00Z',
      status: 'approved',
    },
  ])

  const [filter, setFilter] = useState<
    'all' | 'pending' | 'approved' | 'rejected'
  >('all')

  const filteredReviews = reviews.filter(
    r => filter === 'all' || r.status === filter
  )

  const handleApprove = (id: string) => {
    setReviews(prev =>
      prev.map(r => (r.id === id ? { ...r, status: 'approved' as const } : r))
    )
  }

  const handleReject = (id: string) => {
    setReviews(prev =>
      prev.map(r => (r.id === id ? { ...r, status: 'rejected' as const } : r))
    )
  }

  const stats = {
    total: reviews.length,
    pending: reviews.filter(r => r.status === 'pending').length,
    approved: reviews.filter(r => r.status === 'approved').length,
    rejected: reviews.filter(r => r.status === 'rejected').length,
    avgRating: (
      reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    ).toFixed(1),
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Review Moderation</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Total Reviews</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">
                {stats.pending}
              </p>
            </div>
            <Clock className="w-8 h-8 text-yellow-400" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Approved</p>
              <p className="text-2xl font-bold text-green-600">
                {stats.approved}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Rejected</p>
              <p className="text-2xl font-bold text-red-600">
                {stats.rejected}
              </p>
            </div>
            <XCircle className="w-8 h-8 text-red-400" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Avg Rating</p>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-2xl font-bold text-yellow-600">
              {stats.avgRating}
            </p>
            <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex gap-2">
          {(['all', 'pending', 'approved', 'rejected'] as const).map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === status
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {filteredReviews.map(review => (
          <div key={review.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-bold text-gray-900">
                    {review.patientName}
                  </h3>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-5 h-5 ${
                          i < review.rating
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      review.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : review.status === 'approved'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {review.status}
                  </span>
                </div>

                {review.service && (
                  <p className="text-sm text-gray-600 mb-2">
                    Service: {review.service}
                  </p>
                )}

                <p className="text-gray-700">{review.comment}</p>

                <p className="text-sm text-gray-500 mt-3">
                  Submitted: {new Date(review.submittedAt).toLocaleString()}
                </p>
              </div>
            </div>

            {review.status === 'pending' && (
              <div className="flex gap-3">
                <button
                  onClick={() => handleApprove(review.id)}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <CheckCircle className="w-5 h-5" />
                  Approve
                </button>
                <button
                  onClick={() => handleReject(review.id)}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <XCircle className="w-5 h-5" />
                  Reject
                </button>
              </div>
            )}

            {review.status === 'approved' && (
              <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
                <CheckCircle className="w-5 h-5" />
                Published on website
              </div>
            )}

            {review.status === 'rejected' && (
              <div className="flex items-center gap-2 text-sm text-red-600 font-medium">
                <AlertCircle className="w-5 h-5" />
                Not published
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredReviews.length === 0 && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-500">No reviews to display</p>
        </div>
      )}
    </div>
  )
}
