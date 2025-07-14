import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchWallet } from '../../features/wallet/walletSlice';
import ReactPaginate from 'react-paginate';

const WalletPage = () => {
  const dispatch = useDispatch();
  const { balance, transactions, loading, error, currentPage, totalPages } = useSelector(state => state.wallet);

  useEffect(() => {
    dispatch(fetchWallet({ page: currentPage }));
  }, [dispatch, currentPage]);

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-semibold mb-6">My Wallet</h1>
      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <>
          <div className="bg-green-50 border border-green-400 text-green-700 rounded p-4 mb-6">
            <p className="text-lg">Current Balance: <span className="font-bold">₹{balance.toFixed(2)}</span></p>
          </div>
          <h2 className="text-xl font-medium mb-3">Transactions</h2>
          {transactions.length === 0 ? (
            <p className="text-gray-500">No transactions yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border">
                <thead>
                  <tr className="bg-gray-100 text-left text-sm">
                    <th className="py-2 px-3">Date</th>
                    <th className="py-2 px-3">Type</th>
                    <th className="py-2 px-3">Amount</th>
                    <th className="py-2 px-3">Description</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y">
                  {transactions.map(tx => (
                    <tr key={tx._id}>
                      <td className="py-2 px-3">{new Date(tx.createdAt).toLocaleDateString()}</td>
                      <td className="py-2 px-3">{tx.type}</td>
                      <td className="py-2 px-3">₹{tx.amount.toFixed(2)}</td>
                      <td className="py-2 px-3">{tx.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {/* Pagination */}
          {totalPages > 1 && (
            <ReactPaginate
              previousLabel="← Prev"
              nextLabel="Next →"
              pageCount={totalPages}
              onPageChange={({ selected }) => dispatch(fetchWallet({ page: selected + 1 }))}
              containerClassName="flex items-center justify-center space-x-2 mt-6 font-medium"
              pageClassName="flex items-center justify-center h-8 w-8 rounded-md text-sm border border-gray-300 bg-gray-100 text-gray-800 hover:bg-gray-200 transition-colors"
              activeClassName="bg-gray-800 text-white border-gray-800 hover:bg-gray-700"
              previousClassName="px-3 py-1.5 rounded-md text-sm font-medium border border-gray-300 bg-gray-100 text-gray-800 hover:bg-gray-200 transition-colors"
              nextClassName="px-3 py-1.5 rounded-md text-sm font-medium border border-gray-300 bg-gray-100 text-gray-800 hover:bg-gray-200 transition-colors"
              disabledClassName="opacity-50 cursor-not-allowed"
              breakClassName="px-2 py-1.5 text-gray-500"
              marginPagesDisplayed={1}
              pageRangeDisplayed={3}
              forcePage={currentPage - 1}
            />
          )}
        </>
      )}
    </div>
  );
};

export default WalletPage;
