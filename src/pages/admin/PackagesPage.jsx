import { useState, useEffect } from "react";
import Layout from "../../components/Layout";
import { useLanguage } from "../../hooks/useLanguage";
import {
  subscribeToPackages,
  addPackage,
  updatePackage,
  deletePackage,
  togglePackageAvailability,
} from "../../services/packagesService";

const CATEGORIES = ["beach", "city", "adventure", "cultural"];

const EMPTY_FORM = {
  name: "",
  destination: "",
  duration: "",
  price: "",
  maxCapacity: "",
  category: "beach",
  highlights: "",
  available: true,
  itinerary: [{ day: 1, title: "", description: "" }],
};

export default function PackagesPage() {
  const { t } = useLanguage();
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsub = subscribeToPackages((data) => {
      setPackages(data);
      setLoading(false);
    });
    return unsub;
  }, []);

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (pkg) => {
    setEditing(pkg.id);
    setForm({
      ...pkg,
      highlights: Array.isArray(pkg.highlights)
        ? pkg.highlights.join(", ")
        : pkg.highlights || "",
      itinerary:
        pkg.itinerary?.length > 0
          ? pkg.itinerary
          : [{ day: 1, title: "", description: "" }],
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
    setForm(EMPTY_FORM);
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const payload = {
        ...form,
        duration: Number(form.duration),
        price: Number(form.price),
        maxCapacity: Number(form.maxCapacity),
        highlights: form.highlights
          .split(",")
          .map((h) => h.trim())
          .filter(Boolean),
      };
      if (editing) {
        await updatePackage(editing, payload);
      } else {
        await addPackage({ ...payload, currentBookings: 0 });
      }
      closeModal();
    } finally {
      setSaving(false);
    }
  };

  // Itinerary helpers
  const addDay = () =>
    setForm((f) => ({
      ...f,
      itinerary: [
        ...f.itinerary,
        { day: f.itinerary.length + 1, title: "", description: "" },
      ],
    }));

  const removeDay = (idx) =>
    setForm((f) => ({
      ...f,
      itinerary: f.itinerary
        .filter((_, i) => i !== idx)
        .map((d, i) => ({ ...d, day: i + 1 })),
    }));

  const updateDay = (idx, field, value) =>
    setForm((f) => ({
      ...f,
      itinerary: f.itinerary.map((d, i) =>
        i === idx ? { ...d, [field]: value } : d,
      ),
    }));

  const categoryColor = {
    beach: "bg-blue-100 text-blue-700",
    city: "bg-purple-100 text-purple-700",
    adventure: "bg-green-100 text-green-700",
    cultural: "bg-orange-100 text-orange-700",
  };

  return (
    <Layout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{t("packages")}</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {packages.length} {t("packagesTotal")}
          </p>
        </div>
        <button
          onClick={openAdd}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          {t("addPackage")}
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-12 text-gray-400">
          Loading packages...
        </div>
      )}

      {/* Empty */}
      {!loading && packages.length === 0 && (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <div className="text-5xl mb-4">🌍</div>
          <p className="text-gray-500 font-medium">{t("noPackagesYet")}</p>
          <p className="text-gray-400 text-sm mt-1">{t("noPackagesHint")}</p>
        </div>
      )}

      {/* Grid */}
      {!loading && packages.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Card header */}
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-5 py-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-white text-lg leading-tight">
                      {pkg.name}
                    </h3>
                    <p className="text-blue-100 text-sm mt-0.5">
                      📍 {pkg.destination}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded-full ${
                      pkg.available
                        ? "bg-green-400 text-green-900"
                        : "bg-gray-300 text-gray-600"
                    }`}
                  >
                    {pkg.available ? t("active") : t("inactive")}
                  </span>
                </div>
              </div>

              {/* Card body */}
              <div className="px-5 py-4">
                <div className="flex items-center gap-4 mb-3 text-sm text-gray-600">
                  <span>🗓 {pkg.duration} {t("days")}</span>
                  <span>💰 ${pkg.price}{t("perPerson")}</span>
                  <span>
                    👥 {pkg.currentBookings || 0}/{pkg.maxCapacity}
                  </span>
                </div>

                <span
                  className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full capitalize ${
                    categoryColor[pkg.category] || "bg-gray-100 text-gray-600"
                  }`}
                >
                  {pkg.category}
                </span>

                {/* Actions */}
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => openEdit(pkg)}
                    className="flex-1 text-center text-sm font-medium text-blue-600 hover:bg-blue-50 py-1.5 rounded-lg transition-colors"
                  >
                    {t("edit")}
                  </button>
                  <button
                    onClick={() =>
                      togglePackageAvailability(pkg.id, pkg.available)
                    }
                    className="flex-1 text-center text-sm font-medium text-gray-600 hover:bg-gray-50 py-1.5 rounded-lg transition-colors"
                  >
                    {pkg.available ? t("deactivate") : t("activate")}
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(pkg.id)}
                    className="flex-1 text-center text-sm font-medium text-red-500 hover:bg-red-50 py-1.5 rounded-lg transition-colors"
                  >
                    {t("delete")}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete confirm modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm">
            <h3 className="font-semibold text-gray-800 mb-2">
              {t("deletePackage")}
            </h3>
            <p className="text-sm text-gray-500 mb-4">{t("deleteConfirm")}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                {t("cancel")}
              </button>
              <button
                onClick={async () => {
                  await deletePackage(deleteConfirm);
                  setDeleteConfirm(null);
                }}
                className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium"
              >
                {t("delete")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl w-full max-w-2xl my-8">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="font-semibold text-gray-800">
                {editing ? t("editPackage") : t("addPackage")}
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                ✕
              </button>
            </div>

            {/* Modal body */}
            <div className="px-6 py-4 space-y-4">
              {/* Name + Destination */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("packageName")} *
                  </label>
                  <input
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Santorini Summer"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("destination")} *
                  </label>
                  <input
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={form.destination}
                    onChange={(e) =>
                      setForm({ ...form, destination: e.target.value })
                    }
                    placeholder="Santorini, Greece"
                  />
                </div>
              </div>

              {/* Duration + Price + Capacity */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("duration")}
                  </label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={form.duration}
                    onChange={(e) =>
                      setForm({ ...form, duration: e.target.value })
                    }
                    placeholder="7"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("price")}
                  </label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={form.price}
                    onChange={(e) =>
                      setForm({ ...form, price: e.target.value })
                    }
                    placeholder="1200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("maxCapacity")}
                  </label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={form.maxCapacity}
                    onChange={(e) =>
                      setForm({ ...form, maxCapacity: e.target.value })
                    }
                    placeholder="20"
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("category")}
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value })
                  }
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c.charAt(0).toUpperCase() + c.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Highlights */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("highlights")}{" "}
                  <span className="text-gray-400 font-normal">
                    {t("highlightsHint")}
                  </span>
                </label>
                <input
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.highlights}
                  onChange={(e) =>
                    setForm({ ...form, highlights: e.target.value })
                  }
                  placeholder="Volcano tour, Wine tasting, Sunset cruise"
                />
              </div>

              {/* Itinerary */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    {t("itinerary")}
                  </label>
                  <button
                    onClick={addDay}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    {t("addDay")}
                  </button>
                </div>
                <div className="space-y-3 max-h-48 overflow-y-auto">
                  {form.itinerary.map((day, idx) => (
                    <div key={idx} className="flex gap-2 items-start">
                      <span className="mt-2 text-xs font-semibold text-gray-400 w-10 shrink-0">
                        {t("day")} {day.day}
                      </span>
                      <input
                        className="w-32 px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Title"
                        value={day.title}
                        onChange={(e) =>
                          updateDay(idx, "title", e.target.value)
                        }
                      />
                      <input
                        className="flex-1 px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Description"
                        value={day.description}
                        onChange={(e) =>
                          updateDay(idx, "description", e.target.value)
                        }
                      />
                      {form.itinerary.length > 1 && (
                        <button
                          onClick={() => removeDay(idx)}
                          className="mt-1.5 text-red-400 hover:text-red-600 text-sm"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Available toggle */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="available"
                  checked={form.available}
                  onChange={(e) =>
                    setForm({ ...form, available: e.target.checked })
                  }
                  className="w-4 h-4 rounded accent-blue-600"
                />
                <label htmlFor="available" className="text-sm font-medium text-gray-700">
                  {t("availableForBooking")}
                </label>
              </div>
            </div>

            {/* Modal footer */}
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200">
              <button
                onClick={closeModal}
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                {t("cancel")}
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving || !form.name || !form.destination}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
              >
                {saving ? t("saving") : editing ? t("saveChanges") : t("addPackage")}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
