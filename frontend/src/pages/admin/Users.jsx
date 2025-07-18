import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import Pagination from '../../components/common/Pagination';
import DataTable from '../../components/common/DataTable';
import { fetchUsersThunk, toggleUserBlockThunk } from '../../features/admin/adminUsers/userSlice';
import Input from '../../components/common/Input';
import Loader from '../../components/common/Loader';
import { Loader2, LoaderCircle, LoaderPinwheel } from 'lucide-react';

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

  const handlePageChange = (newPage) => {
    dispatch(fetchUsersThunk({ page: newPage, size, search }));
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

  // Columns definition for DataTable
  const columns = [
    { header: 'Username', accessor: 'username' },
    { header: 'Email', accessor: 'email' },
    { header: 'Status', accessor: (u) => (
        <span className={`px-2 py-1 rounded text-xs font-medium ${u.isBlocked ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
          {u.isBlocked ? 'Blocked' : 'Active'}
        </span>
      )
    },
    { header: 'Joined Date', accessor: (u) => new Date(u.createdAt).toLocaleDateString() },
    { header: 'Actions', accessor: (u) => (
        <button
          onClick={() => handleToggleBlock(u._id)}
          className={`px-3 py-1 rounded text-sm font-medium ${!u.isBlocked ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-red-100 text-red-800 hover:bg-red-200'}`}
        >
          {!u.isBlocked ? 'Active' : 'Blocked'}
        </button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-xl sm:text-2xl font-bold">User Management</h2>

      {/* Search + controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Input
            value={search}
            onChange={handleSearch}
            placeholder="Search users..."
            className="flex-grow max-w-xs"
          />
          <button
            onClick={clearSearch}
            className="p-2 bg-gray-500 text-white rounded-md self-start sm:self-auto"
          >
            Clear
          </button>
        </div>
      </div>

      {loading ? (
        // <p>Loading...</p>
        <Loader/>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <>
          <DataTable columns={columns} data={users || []} />
          {total > size && (
            <Pagination
              currentPage={page}
              totalPages={Math.ceil(total / size)}
              onPageChange={handlePageChange}
              className="mt-6"
            />
          )}
        </>
      )}
    </div>
  );
};

export default Users;
