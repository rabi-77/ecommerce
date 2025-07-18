
import ReactPaginate from 'react-paginate';

/**
 * Reusable pagination component based on react-paginate.
 * Props:
 *  - currentPage (1-based)
 *  - totalPages
 *  - onPageChange(page:number)
 *  - className (optional additional container classes)
 */
const Pagination = ({ currentPage = 1, totalPages = 1, onPageChange, className = '' }) => {
  if (totalPages < 1) return null;

  return (
    <ReactPaginate
      forcePage={currentPage - 1}                // react-paginate is 0-based
      pageCount={totalPages}
      onPageChange={({ selected }) => onPageChange(selected + 1)}
      previousLabel="Prev"
      nextLabel="Next"
      breakLabel="..."
      marginPagesDisplayed={1}
      pageRangeDisplayed={3}
      containerClassName={`flex items-center justify-center space-x-1 ${className}`}
      pageClassName="px-3 py-1.5 rounded-md text-sm hover:bg-gray-100"
      activeClassName="bg-blue-600 text-white"
      previousClassName="px-3 py-1.5 rounded-md text-sm hover:bg-gray-100"
      nextClassName="px-3 py-1.5 rounded-md text-sm hover:bg-gray-100"
      disabledClassName="opacity-50 cursor-not-allowed"
      breakClassName="px-2 py-1.5 text-gray-500"
    />
  );
};

export default Pagination;

