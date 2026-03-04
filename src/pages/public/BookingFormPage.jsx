import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { addBooking } from "../../services/bookingsService";
import { useLanguage } from "../../hooks/useLanguage";

export default function BookingFormPage() {
  const { t } = useLanguage();
  const STEPS = [t("yourDetails"), t("tripDetails"), t("confirmation")];

  const { id } = useParams();
  const navigate = useNavigate();
  const [pkg, setPkg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [form, setForm] = useState({
    clientName: "",
    clientEmail: "",
    clientPhone: "",
    adults: 1,
    children: 0,
    travelDate: "",
    notes: "",
  });

  useEffect(() => {
    const fetchPkg = async () => {
      try {
        const snap = await getDoc(doc(db, "packages", id));
        if (snap.exists()) {
          setPkg({ id: snap.id, ...snap.data() });
        }
      } finally {
        setLoading(false);
      }
    };
    fetchPkg();
  }, [id]);

  const totalPrice = pkg
    ? pkg.price * (Number(form.adults) + Number(form.children) * 0.5)
    : 0;

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await addBooking({
        packageId: pkg.id,
        packageName: pkg.name,
        clientName: form.clientName,
        clientEmail: form.clientEmail,
        clientPhone: form.clientPhone,
        adults: Number(form.adults),
        children: Number(form.children),
        travelDate: new Date(form.travelDate),
        notes: form.notes,
        totalPrice: Math.round(totalPrice),
      });
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  const canNext = () => {
    if (step === 0) return form.clientName && form.clientEmail && form.clientPhone;
    if (step === 1) return form.adults >= 1 && form.travelDate;
    return true;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400">{t("loading")}</p>
      </div>
    );
  }

  if (!pkg) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 font-medium mb-3">{t("packageNotFound")}</p>
          <button
            onClick={() => navigate("/")}
            className="text-blue-600 hover:underline text-sm"
          >
            {t("backToPackages")}
          </button>
        </div>
      </div>
    );
  }

  // Success screen
  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-gray-200 w-full max-w-md p-8 text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">{t("bookingConfirmed")}</h2>
          <p className="text-gray-500 mb-2">
            {t("thankYou")}, <span className="font-medium text-gray-700">{form.clientName}</span>!
          </p>
          <p className="text-gray-400 text-sm mb-6">
            {t("bookingReceived")} <span className="font-medium text-gray-600">{pkg.name}</span>{" "}
            <span className="font-medium text-gray-600">{form.clientEmail}</span> {t("bookingReceivedEnd")}
          </p>
          <div className="bg-blue-50 rounded-xl p-4 mb-6 text-left space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">{t("package")}</span>
              <span className="font-medium text-gray-700">{pkg.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">{t("destination")}</span>
              <span className="text-gray-600">{pkg.destination}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">{t("travelDate")}</span>
              <span className="text-gray-600">
                {new Date(form.travelDate).toLocaleDateString("en-GB", {
                  day: "2-digit", month: "long", year: "numeric",
                })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">{t("guests")}</span>
              <span className="text-gray-600">
                {form.adults} {t("adultsLabel")}{form.children > 0 ? `, ${form.children} ${t("childrenLabel")}` : ""}
              </span>
            </div>
            <div className="flex justify-between border-t border-blue-100 pt-2 mt-2">
              <span className="font-semibold text-gray-700">{t("total")}</span>
              <span className="font-bold text-blue-600">${Math.round(totalPrice)}</span>
            </div>
          </div>
          <button
            onClick={() => navigate("/")}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg text-sm transition-colors"
          >
            {t("backToPackagesBtn")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Back link */}
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600 mb-6 transition-colors"
        >
          {t("backToPackages")}
        </button>

        {/* Package summary */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-5 mb-6 text-white">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-blue-200 text-xs uppercase tracking-wide mb-1">{t("bookingFor")}</p>
              <h2 className="text-xl font-bold">{pkg.name}</h2>
              <p className="text-blue-100 text-sm mt-1">📍 {pkg.destination} · 🗓 {pkg.duration} {t("days")}</p>
            </div>
            <div className="text-right">
              <p className="text-blue-200 text-xs">{t("from")}</p>
              <p className="text-2xl font-bold">${pkg.price}</p>
              <p className="text-blue-200 text-xs">{t("perPerson")}</p>
            </div>
          </div>
        </div>

        {/* Stepper */}
        <div className="flex items-center mb-8">
          {STEPS.map((label, i) => (
            <div key={i} className="flex items-center flex-1">
              <div className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors
                    ${i < step ? "bg-green-500 text-white"
                      : i === step ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-400"
                    }`}
                >
                  {i < step ? "✓" : i + 1}
                </div>
                <span
                  className={`text-sm font-medium hidden sm:block ${
                    i === step ? "text-blue-600" : "text-gray-400"
                  }`}
                >
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-3 ${i < step ? "bg-green-400" : "bg-gray-200"}`} />
              )}
            </div>
          ))}
        </div>

        {/* Form card */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          {/* Step 0 — Personal details */}
          {step === 0 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-800 text-lg mb-4">{t("yourDetails")}</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("fullName")} *
                </label>
                <input
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="John Smith"
                  value={form.clientName}
                  onChange={(e) => setForm({ ...form, clientName: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("emailAddress")} *
                </label>
                <input
                  type="email"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="john@example.com"
                  value={form.clientEmail}
                  onChange={(e) => setForm({ ...form, clientEmail: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("phoneNumber")} *
                </label>
                <input
                  type="tel"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="+40 700 000 000"
                  value={form.clientPhone}
                  onChange={(e) => setForm({ ...form, clientPhone: e.target.value })}
                />
              </div>
            </div>
          )}

          {/* Step 1 — Trip details */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-800 text-lg mb-4">{t("tripDetails")}</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("adultsLabel")} *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={pkg.maxCapacity}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={form.adults}
                    onChange={(e) => setForm({ ...form, adults: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("childrenLabel")} <span className="text-gray-400 font-normal">{t("childrenHint")}</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={form.children}
                    onChange={(e) => setForm({ ...form, children: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("preferredDate")} *
                </label>
                <input
                  type="date"
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.travelDate}
                  onChange={(e) => setForm({ ...form, travelDate: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("specialRequests")}
                </label>
                <textarea
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder={t("specialRequestsHint")}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </div>

              {/* Price preview */}
              <div className="bg-blue-50 rounded-xl p-4 text-sm">
                <div className="flex justify-between mb-1">
                  <span className="text-gray-500">{form.adults} {t("adultsLabel")} × ${pkg.price}</span>
                  <span className="text-gray-700">${pkg.price * Number(form.adults)}</span>
                </div>
                {Number(form.children) > 0 && (
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-500">{form.children} {t("childrenLabel")} × ${pkg.price * 0.5}</span>
                    <span className="text-gray-700">${pkg.price * 0.5 * Number(form.children)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-blue-700 border-t border-blue-200 pt-2 mt-2">
                  <span>Total</span>
                  <span>${Math.round(totalPrice)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Step 2 — Confirmation */}
          {step === 2 && (
            <div>
              <h3 className="font-semibold text-gray-800 text-lg mb-4">{t("confirmation")}</h3>
              <div className="space-y-3 text-sm">
                <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                  <p className="font-medium text-gray-700 mb-2">📋 {t("bookingSummary")}</p>
                  <div className="flex justify-between">
                    <span className="text-gray-500">{t("fullName")}</span>
                    <span className="text-gray-700">{form.clientName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">{t("emailAddress")}</span>
                    <span className="text-gray-700">{form.clientEmail}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">{t("phoneNumber")}</span>
                    <span className="text-gray-700">{form.clientPhone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">{t("package")}</span>
                    <span className="font-medium text-gray-700">{pkg.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">{t("destination")}</span>
                    <span className="text-gray-700">{pkg.destination}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">{t("travelDate")}</span>
                    <span className="text-gray-700">
                      {new Date(form.travelDate).toLocaleDateString("en-GB", {
                        day: "2-digit", month: "long", year: "numeric",
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">{t("guests")}</span>
                    <span className="text-gray-700">
                      {form.adults} {t("adultsLabel")}{Number(form.children) > 0 ? `, ${form.children} ${t("childrenLabel")}` : ""}
                    </span>
                  </div>
                  {form.notes && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">{t("notes")}</span>
                      <span className="text-gray-700 text-right max-w-48">{form.notes}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-gray-200 pt-2 mt-2">
                    <span className="font-bold text-gray-800">{t("totalPrice")}</span>
                    <span className="font-bold text-blue-600 text-base">${Math.round(totalPrice)}</span>
                  </div>
                </div>
                <p className="text-gray-400 text-xs text-center">
                  {t("byConfirming")}
                </p>
              </div>
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex justify-between mt-6 pt-4 border-t border-gray-100">
            <button
              onClick={() => step > 0 ? setStep(step - 1) : navigate("/")}
              className="px-5 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              ← {step === 0 ? t("back") : t("previous")}
            </button>

            {step < STEPS.length - 1 ? (
              <button
                onClick={() => setStep(step + 1)}
                disabled={!canNext()}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-40 transition-colors"
              >
                {t("next")} →
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
              >
                {submitting ? t("submitting") : t("confirmBooking")}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
