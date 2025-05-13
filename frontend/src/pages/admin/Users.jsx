import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import ReactPaginate from 'react-paginate';
import axios from 'axios';
import UserBlockToggle from '../../components/admin/UserBlockToggle';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchUsers();
  }, [page, size, search]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(
        `http://localhost:5000/admin/users?page=${page}&size=${size}&search=${search}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      setUsers(response.data.users);
      setTotal(response.data.total);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch users');
      toast.error(err.response?.data?.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setPage(1); // Reset to first page on new search
  };

  const clearSearch = () => {
    setSearch('');
    setPage(1);
  };

  const handlePageChange = ({ selected }) => {
    setPage(selected + 1);
  };

  const handleToggleSuccess = () => {
    fetchUsers(); // Refresh the user list after toggling
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
                      <UserBlockToggle 
                        user={user} 
                        onToggleSuccess={handleToggleSuccess} 
                      />
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
                containerClassName="flex space-x-2"
                pageClassName="px-3 py-1 rounded border hover:bg-gray-100"
                previousClassName="px-3 py-1 rounded border hover:bg-gray-100"
                nextClassName="px-3 py-1 rounded border hover:bg-gray-100"
                activeClassName="bg-blue-500 text-white border-blue-500"
                disabledClassName="text-gray-300 cursor-not-allowed"
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
  
