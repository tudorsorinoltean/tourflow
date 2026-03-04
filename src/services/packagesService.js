import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../lib/firebase";

const COL = "packages";

export function subscribeToPackages(callback) {
  return onSnapshot(collection(db, COL), (snap) => {
    const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(data);
  });
}

export async function addPackage(pkg) {
  await addDoc(collection(db, COL), { ...pkg, createdAt: serverTimestamp() });
}

export async function updatePackage(id, pkg) {
  await updateDoc(doc(db, COL, id), pkg);
}

export async function deletePackage(id) {
  await deleteDoc(doc(db, COL, id));
}

export async function togglePackageAvailability(id, current) {
  await updateDoc(doc(db, COL, id), { available: !current });
}