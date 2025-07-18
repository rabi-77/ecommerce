import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchWallet } from '../../features/wallet/walletSlice';
import Pagination from '../../components/common/Pagination';
import DataTable from '../../components/common/DataTable';

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
            <DataTable
              columns={[
                { header: 'Date', accessor: (tx) => new Date(tx.createdAt).toLocaleDateString() },
                { header: 'Type', accessor: 'type' },
                { header: 'Amount', accessor: (tx) => `₹${tx.amount.toFixed(2)}` },
                { header: 'Description', accessor: 'description' },
              ]}
              data={transactions}
            />
          )}
          {/* Pagination */}
          {totalPages >= 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(page) => dispatch(fetchWallet({ page }))}
              className="mt-6"
            />
          )}
        </>
      )}
    </div>
  );
};

export default WalletPage;
