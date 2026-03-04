import { useState, useEffect } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../../lib/firebase";
import Layout from "../../components/Layout";
import {
  subscribeToBookings,
  updateBookingStatus,
} from "../../services/bookingsService";
import { generateBookingPDF } from "../../services/pdfService";
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

export default function BookingsPage() {
  const { t } = useLanguage();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterSearch, setFilterSearch] = useState("");
  const [packages, setPackages] = useState({});

  useEffect(() => {
    const unsub = subscribeToBookings((data) => {
      setBookings(data);
      setLoading(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "packages"), (snap) => {
      const map = {};
      snap.docs.forEach((d) => {
        map[d.id] = { id: d.id, ...d.data() };
      });
      setPackages(map);
    });
    return unsub;
  }, []);

  const filtered = bookings.filter((b) => {
    const matchStatus = filterStatus === "all" || b.status === filterStatus;
    const matchSearch =
      filterSearch === "" ||
      b.clientName?.toLowerCase().includes(filterSearch.toLowerCase()) ||
      b.packageName?.toLowerCase().includes(filterSearch.toLowerCase()) ||
      b.clientEmail?.toLowerCase().includes(filterSearch.toLowerCase());
    return matchStatus && matchSearch;
  });

  const counts = {
    all: bookings.length,
    pending: bookings.filter((b) => b.status === "pending").length,
    confirmed: bookings.filter((b) => b.status === "confirmed").length,
    cancelled: bookings.filter((b) => b.status === "cancelled").length,
  };

  const formatDate = (ts) => {
    if (!ts) return "—";
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  };

  return (
    <Layout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{t("bookings")}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{bookings.length} {t("bookingsTotal")}</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {["all", "pending", "confirmed", "cancelled"].map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors capitalize
              ${filterStatus === s
                ? "bg-blue-600 text-white"
                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
          >
            {t(s)} ({counts[s]})
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          className="w-full sm:w-72 px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder={t("searchPlaceholder")}
          value={filterSearch}
          onChange={(e) => setFilterSearch(e.target.value)}
        />
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-12 text-gray-400">Loading bookings...</div>
      )}

      {/* Empty */}
      {!loading && filtered.length === 0 && (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <div className="text-5xl mb-4">📋</div>
          <p className="text-gray-500 font-medium">{t("noBookingsFound")}</p>
          <p className="text-gray-400 text-sm mt-1">{t("noBookingsHint")}</p>
        </div>
      )}

      {/* Table — desktop */}
      {!loading && filtered.length > 0 && (
        <>
          <div className="hidden md:block bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-5 py-3 font-medium text-gray-500">{t("client")}</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-500">{t("package")}</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-500">{t("travelDate")}</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-500">{t("guests")}</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-500">{t("total")}</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-500">{t("status")}</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-500">{t("actions")}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((b) => (
                  <tr
                    key={b.id}
                    className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                    onClick={() => setSelected(b)}
                  >
                    <td className="px-5 py-3">
                      <p className="font-medium text-gray-800">{b.clientName}</p>
                      <p className="text-gray-400 text-xs">{b.clientEmail}</p>
                    </td>
                    <td className="px-5 py-3 text-gray-600">{b.packageName}</td>
                    <td className="px-5 py-3 text-gray-600">{formatDate(b.travelDate)}</td>
                    <td className="px-5 py-3 text-gray-600">
                      {b.adults || 0}A {b.children > 0 ? `+ ${b.children}C` : ""}
                    </td>
                    <td className="px-5 py-3 font-medium text-gray-800">${b.totalPrice}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[b.status]}`}>
                        {STATUS_ICONS[b.status]} {b.status}
                      </span>
                    </td>
                    <td className="px-5 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex gap-2">
                        {b.status !== "confirmed" && (
                          <button
                            onClick={() => updateBookingStatus(b.id, "confirmed")}
                            className="text-xs text-green-600 hover:underline font-medium"
                          >
                            {t("confirm")}
                          </button>
                        )}
                        {b.status !== "cancelled" && (
                          <button
                            onClick={() => updateBookingStatus(b.id, "cancelled")}
                            className="text-xs text-red-500 hover:underline font-medium"
                          >
                            {t("cancelled")}
                          </button>
                        )}
                        {b.status !== "pending" && (
                          <button
                            onClick={() => updateBookingStatus(b.id, "pending")}
                            className="text-xs text-yellow-600 hover:underline font-medium"
                          >
                            {t("pending")}
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            generateBookingPDF(b, packages[b.packageId], t);
                          }}
                          className="text-xs text-blue-600 hover:underline font-medium"
                        >
                          {t("downloadPDF")}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Cards — mobile */}
          <div className="md:hidden space-y-3">
            {filtered.map((b) => (
              <div
                key={b.id}
                className="bg-white rounded-xl border border-gray-200 p-4 cursor-pointer"
                onClick={() => setSelected(b)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium text-gray-800">{b.clientName}</p>
                    <p className="text-xs text-gray-400">{b.clientEmail}</p>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[b.status]}`}>
                    {STATUS_ICONS[b.status]} {b.status}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-1">{b.packageName}</p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">{formatDate(b.travelDate)}</span>
                  <span className="font-semibold text-gray-800">${b.totalPrice}</span>
                </div>
                <div className="flex gap-3 mt-3 pt-3 border-t border-gray-100" onClick={(e) => e.stopPropagation()}>
                  {b.status !== "confirmed" && (
                    <button
                      onClick={() => updateBookingStatus(b.id, "confirmed")}
                      className="text-xs text-green-600 font-medium"
                    >
                      ✅ {t("confirm")}
                    </button>
                  )}
                  {b.status !== "cancelled" && (
                    <button
                      onClick={() => updateBookingStatus(b.id, "cancelled")}
                      className="text-xs text-red-500 font-medium"
                    >
                      ❌ {t("cancelled")}
                    </button>
                  )}
                  {b.status !== "pending" && (
                    <button
                      onClick={() => updateBookingStatus(b.id, "pending")}
                      className="text-xs text-yellow-600 font-medium"
                    >
                      ⏳ {t("pending")}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Detail modal */}
      {selected && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="font-semibold text-gray-800">{t("bookingDetails")}</h2>
              <button
                onClick={() => setSelected(null)}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                ✕
              </button>
            </div>
            <div className="px-6 py-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">{t("status")}</span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[selected.status]}`}>
                  {STATUS_ICONS[selected.status]} {t(selected.status)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">{t("client")}</span>
                <span className="font-medium text-gray-800">{selected.clientName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">{t("email")}</span>
                <span className="text-gray-600">{selected.clientEmail}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">{t("phone")}</span>
                <span className="text-gray-600">{selected.clientPhone || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">{t("package")}</span>
                <span className="font-medium text-gray-800">{selected.packageName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">{t("travelDate")}</span>
                <span className="text-gray-600">{formatDate(selected.travelDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">{t("guests")}</span>
                <span className="text-gray-600">
                  {selected.adults} {t("adults")}{selected.children > 0 ? `, ${selected.children} ${t("children")}` : ""}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">{t("totalPrice")}</span>
                <span className="font-bold text-gray-800">${selected.totalPrice}</span>
              </div>
              {selected.notes && (
                <div>
                  <span className="text-gray-500 block mb-1">{t("notes")}</span>
                  <p className="text-gray-600 bg-gray-50 rounded-lg p-3">{selected.notes}</p>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">{t("bookedOn")}</span>
                <span className="text-gray-400 text-xs">{formatDate(selected.createdAt)}</span>
              </div>
            </div>
            <div className="flex gap-3 px-6 py-4 border-t border-gray-200">
              <button
                onClick={() => generateBookingPDF(selected, packages[selected.packageId], t)}
                className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
              >
                📄 {t("downloadPDF")}
              </button>
              {selected.status !== "confirmed" && (
                <button
                  onClick={() => { updateBookingStatus(selected.id, "confirmed"); setSelected(null); }}
                  className="flex-1 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium"
                >
                  ✅ {t("confirm")}
                </button>
              )}
              {selected.status !== "cancelled" && (
                <button
                  onClick={() => { updateBookingStatus(selected.id, "cancelled"); setSelected(null); }}
                  className="flex-1 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium"
                >
                  ❌ {t("cancelled")}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}