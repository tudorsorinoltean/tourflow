import {
  collection,
  addDoc,
  updateDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "../lib/firebase";

const COL = "bookings";

export function subscribeToBookings(callback) {
  const q = query(collection(db, COL), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(data);
  });
}

export async function addBooking(booking) {
  await addDoc(collection(db, COL), {
    ...booking,
    status: "pending",
    createdAt: serverTimestamp(),
  });
}

export async function updateBookingStatus(id, status) {
  await updateDoc(doc(db, COL, id), { status });
}