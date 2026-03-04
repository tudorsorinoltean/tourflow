import { useState, useEffect } from "react";
import { collection, onSnapshot, query, orderBy, limit } from "firebase/firestore";
import { db } from "../../lib/firebase";
import Layout from "../../components/Layout";
import { useLanguage } from "../../hooks/useLanguage";

const STATUS_COLORS = {
  pending: "bg-yellow-100 text-yellow-700",
  confirmed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

const STATUS_ICONS = {
  pending: "⏳",
  confirmed: "✅",
  cancelled: "❌",
};

function KPICard({ label, value, sub, icon, color }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-start gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-500 font-medium">{label}</p>
        <p className="text-2xl font-bold text-gray-800 mt-0.5">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { t } = useLanguage();
  const [packages, setPackages] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubPkg = onSnapshot(collection(db, "packages"), (snap) => {
      setPackages(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    const unsubBook = onSnapshot(collection(db, "bookings"), (snap) => {
      setBookings(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });

    const q = query(collection(db, "bookings"), orderBy("createdAt", "desc"), limit(5));
    const unsubRecent = onSnapshot(q, (snap) => {
      setRecentBookings(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsubPkg();
      unsubBook();
      unsubRecent();
    };
  }, []);

  const confirmed = bookings.filter((b) => b.status === "confirmed").length;
  const pending = bookings.filter((b) => b.status === "pending").length;
  const revenue = bookings
    .filter((b) => b.status === "confirmed")
    .reduce((sum, b) => sum + (b.totalPrice || 0), 0);

  const formatDate = (ts) => {
    if (!ts) return "—";
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  };

  return (
    <Layout>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">{t("dashboard")}</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>

      {/* KPI Cards */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">{t("loading")}</div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
            <KPICard
              label={t("totalPackages")}
              value={packages.length}
              sub={`${packages.filter((p) => p.available).length} active`}
              icon="🌍"
              color="bg-blue-50"
            />
            <KPICard
              label={t("totalBookings")}
              value={bookings.length}
              sub={`${pending} ${t("pendingBookings").toLowerCase()}`}
              icon="📋"
              color="bg-purple-50"
            />
            <KPICard
              label={t("confirmedBookings")}
              value={confirmed}
              sub={`${bookings.length > 0 ? Math.round((confirmed / bookings.length) * 100) : 0}% ${t("conversion")}`}
              icon="✅"
              color="bg-green-50"
            />
            <KPICard
              label={t("revenue")}
              value={`$${revenue.toLocaleString()}`}
              sub={t("confirmedOnly")}
              icon="💰"
              color="bg-yellow-50"
            />
          </div>

          {/* Recent Bookings */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <h2 className="font-semibold text-gray-800">{t("recentBookings")}</h2>
              <a
                href="/admin/bookings"
                className="text-sm text-blue-600 hover:underline font-medium"
              >
                {t("viewAll")} →
              </a>
            </div>

            {recentBookings.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-400">{t("noBookingsYet")}</p>
              </div>
            ) : (
              <>
                {/* Desktop */}
                <div className="hidden md:block">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="text-left px-5 py-3 font-medium text-gray-500">{t("client")}</th>
                        <th className="text-left px-5 py-3 font-medium text-gray-500">{t("package")}</th>
                        <th className="text-left px-5 py-3 font-medium text-gray-500">{t("travelDate")}</th>
                        <th className="text-left px-5 py-3 font-medium text-gray-500">{t("total")}</th>
                        <th className="text-left px-5 py-3 font-medium text-gray-500">{t("status")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentBookings.map((b) => (
                        <tr key={b.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="px-5 py-3">
                            <p className="font-medium text-gray-800">{b.clientName}</p>
                            <p className="text-gray-400 text-xs">{b.clientEmail}</p>
                          </td>
                          <td className="px-5 py-3 text-gray-600">{b.packageName}</td>
                          <td className="px-5 py-3 text-gray-600">{formatDate(b.travelDate)}</td>
                          <td className="px-5 py-3 font-medium text-gray-800">${b.totalPrice}</td>
                          <td className="px-5 py-3">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[b.status]}`}>
                              {STATUS_ICONS[b.status]} {t(b.status)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile */}
                <div className="md:hidden divide-y divide-gray-100">
                  {recentBookings.map((b) => (
                    <div key={b.id} className="px-4 py-3 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-800 text-sm">{b.clientName}</p>
                        <p className="text-gray-400 text-xs">{b.packageName}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-800 text-sm">${b.totalPrice}</p>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[b.status]}`}>
                          {STATUS_ICONS[b.status]} {t(b.status)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </>
      )}
    </Layout>
  );
}