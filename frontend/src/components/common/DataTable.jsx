import PropTypes from 'prop-types';

/**
 * Generic reusable DataTable component.
 *
 * Props:
 *  - columns: Array<{
 *      header: string | ReactNode,
 *      accessor: string | (row) => any,    // key in row object or custom function
 *      cell: (value, row) => ReactNode,    // optional custom cell renderer
 *      className?: string                  // optional cell/ header class
 *    }>
 *  - data: array of objects to render
 *  - keyField: property that uniquely identifies each row (defaults to _id)
 *  - className: optional container classes
 */
const DataTable = ({ columns, data, keyField = '_id', className = '' }) => {
  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="min-w-full divide-y divide-gray-200 bg-white">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((col) => (
              <th
                key={col.header?.toString() ?? col.accessor}
                className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${col.className || ''}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {data.map((row) => (
            <tr key={row[keyField] || Math.random()} className="hover:bg-gray-50">
              {columns.map((col, idx) => {
                // Determine value via accessor
                let value;
                if (typeof col.accessor === 'function') {
                  value = col.accessor(row);
                } else {
                  value = row[col.accessor];
                }
                const content = col.cell ? col.cell(value, row) : value;
                return (
                  <td key={idx} className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 ${col.className || ''}`}>
                    {content}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

DataTable.propTypes = {
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      header: PropTypes.oneOfType([PropTypes.string, PropTypes.node]).isRequired,
      accessor: PropTypes.oneOfType([PropTypes.string, PropTypes.func]).isRequired,
      cell: PropTypes.func,
      className: PropTypes.string,
    })
  ).isRequired,
  data: PropTypes.array.isRequired,
  keyField: PropTypes.string,
  className: PropTypes.string,
};

export default DataTable;
