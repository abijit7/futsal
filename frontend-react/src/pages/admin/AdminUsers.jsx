import { useEffect, useState } from 'react';
import { UserAPI } from '../../api/user.js';
import { formatDateTime } from '../../utils/format.js';
import { useToast } from '../../components/ToastProvider.jsx';
import { useConfirm } from '../../components/ConfirmProvider.jsx';
import Pagination from '../../components/Pagination.jsx';

export default function AdminUsers() {
  const { showToast } = useToast();
  const { confirm } = useConfirm();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const pageSize = 10;

  const loadUsers = async (targetPage = page) => {
    setLoading(true);
    try {
      const data = await UserAPI.getAll({ page: targetPage, size: pageSize });
      const items = data?.items ?? data ?? [];
      setUsers(items);
      setTotalPages(data?.totalPages ?? (items.length > 0 ? 1 : 0));
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers(page);
  }, [page]);

  const deleteUser = async (userId, name) => {
    const ok = await confirm(`Delete user "${name}"? This will also delete their bookings.`);
    if (!ok) return;
    try {
      await UserAPI.delete(userId);
      showToast('User deleted successfully', 'success');
      loadUsers();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const filtered = users.filter((u) =>
    u.name.toLowerCase().includes(query.toLowerCase()) || u.email.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <>
      <div className="page-header">
        <div className="container">
          <h1>MANAGE <span>USERS</span></h1>
          <p>View all registered users on the platform</p>
        </div>
      </div>

      <div className="container page-wrap">
        <div className="card mb-3">
          <input
            type="text"
            className="form-control"
            placeholder="🔍 Search users by name or email..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="card">
          <div className="card-header">
            <h2>All Users</h2>
            <button onClick={loadUsers} className="btn btn-secondary btn-sm">🔄 Refresh</button>
          </div>

          {loading ? (
            <div className="loading-wrap"><div className="spinner"></div><p>Loading users...</p></div>
          ) : filtered.length === 0 ? (
            <div className="empty-state"><div className="icon">👥</div><h3>No users found</h3></div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>#</th><th>Name</th><th>Email</th><th>Phone</th><th>Role</th><th>Joined</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {filtered.map((u, i) => (
                    <tr key={u.userId}>
                      <td className="text-muted text-sm">{page * pageSize + i + 1}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div className="nav-avatar">{u.name.charAt(0).toUpperCase()}</div>
                          <span className="fw-bold">{u.name}</span>
                        </div>
                      </td>
                      <td className="text-muted">{u.email}</td>
                      <td className="text-muted">{u.phone}</td>
                      <td>
                        <span className={`badge ${u.role === 'ADMIN' ? 'badge-approved' : 'badge-pending'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="text-muted text-sm">{formatDateTime(u.createdAt)}</td>
                      <td>
                        {u.role !== 'ADMIN' ? (
                          <button className="btn btn-danger btn-sm" onClick={() => deleteUser(u.userId, u.name)}>🗑️ Delete</button>
                        ) : (
                          <span className="text-muted text-sm">Protected</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {!loading && filtered.length > 0 && (
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          )}
        </div>
      </div>
    </>
  );
}
