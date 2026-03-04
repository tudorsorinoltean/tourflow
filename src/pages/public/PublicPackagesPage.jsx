import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useLanguage } from "../../hooks/useLanguage";

const CATEGORIES = ["all", "beach", "city", "adventure", "cultural"];

const CATEGORY_ICONS = {
  beach: "🏖",
  city: "🏙",
  adventure: "🏔",
  cultural: "🏛",
};

const CATEGORY_COLORS = {
  beach: "bg-blue-100 text-blue-700",
  city: "bg-purple-100 text-purple-700",
  adventure: "bg-green-100 text-green-700",
  cultural: "bg-orange-100 text-orange-700",
};

export default function PublicPackagesPage() {
  const { lang, t, toggleLang } = useLanguage();
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterMaxPrice, setFilterMaxPrice] = useState("");
  const [filterMaxDuration, setFilterMaxDuration] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const q = query(collection(db, "packages"), where("available", "==", true));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setPackages(data);
      setLoading(false);
    });
    return unsub;
  }, []);

  const filtered = packages.filter((p) => {
    const matchCat = filterCategory === "all" || p.category === filterCategory;
    const matchPrice = filterMaxPrice === "" || p.price <= Number(filterMaxPrice);
    const matchDuration = filterMaxDuration === "" || p.duration <= Number(filterMaxDuration);
    return matchCat && matchPrice && matchDuration;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="flex items-center gap-3 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M21 16v-2l-8-5V3.5A1.5 1.5 0 0 0 11.5 2A1.5 1.5 0 0 0 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1l3.5 1v-1.5L13 19v-5.5z"/>
            </svg>
            <span className="text-3xl font-bold">TourFlow</span>
          </div>
          <h1 className="text-4xl font-bold mb-2">{t("discoverTitle")}</h1>
          <p className="text-blue-100 text-lg">
            {t("discoverSubtitle")}
          </p>
          <button
            onClick={toggleLang}
            className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-blue-400 text-sm font-medium text-white hover:bg-blue-500 transition-colors"
          >
            🌐 {lang.toUpperCase()}
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-8">
          <div className="flex flex-wrap gap-4 items-end">
            {/* Category */}
            <div className="flex-1 min-w-40">
              <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">
                {t("categoryLabel")}
              </label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((c) => (
                  <button
                    key={c}
                    onClick={() => setFilterCategory(c)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors capitalize
                      ${filterCategory === c
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                  >
                    {c === "all" ? t("all") : `${CATEGORY_ICONS[c]} ${t(c)}`}
                  </button>
                ))}
              </div>
            </div>

            {/* Max price + Max duration — same row always */}
            <div className="flex gap-3 w-full sm:w-auto">
              <div className="flex-1 sm:w-36">
                <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">
                  {t("maxPrice")}
                </label>
                <input
                  type="number"
                  placeholder={t("any")}
                  value={filterMaxPrice}
                  onChange={(e) => setFilterMaxPrice(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex-1 sm:w-36">
                <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">
                  {t("maxDays")}
                </label>
                <input
                  type="number"
                  placeholder={t("any")}
                  value={filterMaxDuration}
                  onChange={(e) => setFilterMaxDuration(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Reset */}
            {(filterCategory !== "all" || filterMaxPrice || filterMaxDuration) && (
              <button
                onClick={() => {
                  setFilterCategory("all");
                  setFilterMaxPrice("");
                  setFilterMaxDuration("");
                }}
                className="text-sm text-blue-600 hover:underline font-medium"
              >
                {t("resetFilters")}
              </button>
            )}
          </div>
        </div>

        {/* Results count */}
        {!loading && (
          <p className="text-sm text-gray-500 mb-4">
            {filtered.length} {filtered.length === 1 ? t("packageAvailable") : t("packagesAvailable")}
          </p>
        )}

        {/* Loading */}
        {loading && (
          <div className="text-center py-16 text-gray-400">Loading packages...</div>
        )}

        {/* Empty */}
        {!loading && filtered.length === 0 && (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <div className="text-5xl mb-4">🔍</div>
            <p className="text-gray-500 font-medium">{t("noPackagesMatch")}</p>
            <button
              onClick={() => {
                setFilterCategory("all");
                setFilterMaxPrice("");
                setFilterMaxDuration("");
              }}
              className="mt-3 text-sm text-blue-600 hover:underline"
            >
              {t("clearFilters")}
            </button>
          </div>
        )}

        {/* Grid */}
        {!loading && filtered.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filtered.map((pkg) => (
              <div
                key={pkg.id}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow group"
              >
                {/* Image placeholder */}
                <div className="h-48 bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center relative overflow-hidden">
                  <span className="text-7xl opacity-30">
                    {CATEGORY_ICONS[pkg.category] || "🌍"}
                  </span>
                  <div className="absolute inset-0 flex flex-col justify-between p-4">
                    <div className="flex justify-between items-start">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${CATEGORY_COLORS[pkg.category]}`}>
                        {CATEGORY_ICONS[pkg.category]} {pkg.category}
                      </span>
                      <span className="bg-white bg-opacity-90 text-blue-700 text-xs font-bold px-2.5 py-1 rounded-full">
                        {pkg.duration} {t("days")}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-xl leading-tight drop-shadow">
                        {pkg.name}
                      </h3>
                      <p className="text-blue-100 text-sm drop-shadow">
                        📍 {pkg.destination}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Card body */}
                <div className="p-5">
                  {/* Highlights */}
                  {pkg.highlights?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {pkg.highlights.slice(0, 3).map((h, i) => (
                        <span
                          key={i}
                          className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full"
                        >
                          {h}
                        </span>
                      ))}
                      {pkg.highlights.length > 3 && (
                        <span className="text-xs text-gray-400 px-2 py-1">
                          +{pkg.highlights.length - 3} {t("more")}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Price + capacity */}
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <span className="text-2xl font-bold text-gray-800">${pkg.price}</span>
                      <span className="text-gray-400 text-sm"> {t("perPerson")}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400">{t("availabilityLabel")}</p>
                      <p className="text-sm font-medium text-gray-600">
                        {pkg.maxCapacity - (pkg.currentBookings || 0)} {t("spotsLeft")}
                      </p>
                    </div>
                  </div>

                  {/* CTA */}
                  <button
                    onClick={() => navigate(`/book/${pkg.id}`)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg text-sm transition-colors"
                  >
                    {t("bookNow")}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-center py-8 text-sm text-gray-400 border-t border-gray-200 mt-12">
        © 2026 TourFlow — All rights reserved
      </div>
    </div>
  );
}