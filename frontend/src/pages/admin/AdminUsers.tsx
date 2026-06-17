import { useEffect, useState } from 'react';
import { userApi } from '../../api/modules';
import { Pagination } from '../../components/Pagination';
import { EmptyState, LoadingState } from '../../components/State';
import type { User } from '../../types/api';

export function AdminUsers() {
  const [items, setItems] = useState<User[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const data = await userApi.list(page, 10);
    setItems(data.items || []);
    setTotalPages(data.totalPages || 0);
    setLoading(false);
  };
  useEffect(() => { load(); }, [page]);

  const remove = async (id: number) => {
    if (!confirm('Delete this user?')) return;
    await userApi.delete(id);
    await load();
  };

  return (
    <section>
      {loading ? <LoadingState /> : items.length === 0 ? <EmptyState title="No users found" /> : (
        <div className="table-wrap">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-widest text-slate-500"><tr><th className="p-4">Name</th><th className="p-4">Email</th><th className="p-4">Phone</th><th className="p-4">Role</th><th className="p-4"></th></tr></thead>
            <tbody>{items.map((user) => <tr key={user.userId} className="border-t border-slate-100"><td className="p-4 font-black">{user.name}</td><td className="p-4">{user.email}</td><td className="p-4">{user.phone}</td><td className="p-4"><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black">{user.role}</span></td><td className="p-4 text-right"><button className="btn-navy px-4 py-2" onClick={() => remove(user.userId)}>Delete</button></td></tr>)}</tbody>
          </table>
        </div>
      )}
      <Pagination page={page} totalPages={totalPages} onPage={setPage} />
    </section>
  );
}
