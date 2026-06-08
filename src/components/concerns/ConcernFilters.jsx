const ConcernFilters = ({
  searchQuery, onSearchChange,
  statusFilter, onStatusChange,
  categoryFilter, onCategoryChange,
  sortBy, onSortByChange,
  sortOrder, onSortOrderChange,
  hideStatusAndSort = false,
  includeArchived = false,
}) => {
  return (
    <>
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by title, description, student name, or ID..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      <div className={`grid grid-cols-1 ${hideStatusAndSort ? 'md:grid-cols-1' : 'md:grid-cols-4'} gap-4 mb-6`}>
        {!hideStatusAndSort && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Filter by Status</label>
            <select
              value={statusFilter}
              onChange={(e) => onStatusChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="read">Read</option>
              <option value="in_review">In Progress</option>
              <option value="resolved">Resolved</option>
              {includeArchived && <option value="deleted">Archived</option>}
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Filter by Category</label>
          <select
            value={categoryFilter}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Categories</option>
            <option value="academic">Academic</option>
            <option value="behavioral">Behavioral</option>
            <option value="general">General</option>
            <option value="safety">Safety</option>
            <option value="other">Other</option>
          </select>
        </div>

        {!hideStatusAndSort && (
          <>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => onSortByChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="created_at">Date Created</option>
                <option value="updated_at">Last Updated</option>
                <option value="status">Status</option>
                <option value="category">Category</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Order</label>
              <select
                value={sortOrder}
                onChange={(e) => onSortOrderChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="DESC">Newest First</option>
                <option value="ASC">Oldest First</option>
              </select>
            </div>
          </>
        )}
      </div>
    </>
  )
}

export default ConcernFilters
