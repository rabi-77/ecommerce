import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import ReactPaginate from 'react-paginate';
import { fetchUsersThunk, toggleUserBlockThunk } from '../../features/admin/adminUsers/userSlice';

const Users = () => {
  const dispatch = useDispatch();
  const { users, loading, error, total, page, size } = useSelector(state => state.adminUsers);
  const [search, setSearch] = useState('');

  useEffect(() => {
    dispatch(fetchUsersThunk({ page, size, search }));
  }, [dispatch, page, size, search]);

  const refreshUsers = () => {
    dispatch(fetchUsersThunk({ page, size, search }));
  };

  const handleSearch = (e) => {
    setSearch(e.target.value);
    // Reset to first page and fetch with new search
    dispatch(fetchUsersThunk({ page: 1, size, search: e.target.value }));
  };

  const clearSearch = () => {
    setSearch('');
    // Reset to first page and fetch with empty search
    dispatch(fetchUsersThunk({ page: 1, size, search: '' }));
  };

  const handlePageChange = ({ selected }) => {
    dispatch(fetchUsersThunk({ page: selected + 1, size, search }));
  };

  const handleToggleBlock = async (userId) => {
    try {
      const resultAction = await dispatch(toggleUserBlockThunk(userId));
      
      if (toggleUserBlockThunk.fulfilled.match(resultAction)) {
        toast.success(resultAction.payload.message);
        refreshUsers(); // Refresh the user list after toggling
      } else if (toggleUserBlockThunk.rejected.match(resultAction)) {
        throw new Error(resultAction.payload || 'Failed to toggle user block status');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to toggle user block status');
      console.error(error);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">User Management</h2>
      
      <div className="flex justify-between items-center">
        <div className="flex space-x-2">
          <input
            type="text"
            value={search}
            onChange={handleSearch}
            placeholder="Search users..."
            className="p-2 border rounded-md w-64"
          />
          <button
            onClick={clearSearch}
            className="p-2 bg-gray-500 text-white rounded-md"
          >
            Clear
          </button>
        </div>
      </div>
      
      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <>
          <table className="w-full border-collapse bg-white rounded-lg shadow">
            <thead>
              <tr className="bg-gray-200">
                <th className="p-3 text-left">Username</th>
                <th className="p-3 text-left">Email</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Joined Date</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users && users.length > 0 ? (
                users.map((user) => (
                  <tr key={user._id} className="border-b">
                    <td className="p-3">{user.username}</td>
                    <td className="p-3">{user.email}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${user.isBlocked ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                        {user.isBlocked ? 'Blocked' : 'Active'}
                      </span>
                    </td>
                    <td className="p-3">{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td className="p-3">
                      <button
                        onClick={() => handleToggleBlock(user._id)}
                        className={`px-3 py-1 rounded text-sm font-medium ${
                          !user.isBlocked
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-red-100 text-red-800 hover:bg-red-200'
                        }`}
                      >
                        {!user.isBlocked ? 'Active' : 'Blocked'}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="p-3 text-center text-gray-500">
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          
          {total > size && (
            <div className="flex justify-center mt-6">
              <ReactPaginate
                previousLabel="Previous"
                nextLabel="Next"
                pageCount={Math.ceil(total / size)}
                onPageChange={handlePageChange}
                containerClassName="flex items-center justify-center gap-2"
                pageClassName="px-3 py-2 rounded border border-gray-300 hover:bg-gray-100 transition-colors"
                previousClassName="px-3 py-2 rounded border border-gray-300 hover:bg-gray-100 transition-colors"
                nextClassName="px-3 py-2 rounded border border-gray-300 hover:bg-gray-100 transition-colors"
                activeClassName="!bg-gray-800 text-white border-gray-800"
                disabledClassName="opacity-50 cursor-not-allowed hover:bg-white"
                breakClassName="px-3 py-2"
                forcePage={page - 1}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Users;
  
