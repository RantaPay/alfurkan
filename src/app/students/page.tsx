"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { ReceiptModal } from "@/components/receipts/ReceiptModal";
import { Student } from "@/lib/types";
import { formatNaira } from "@/lib/utils";
import {
  Search,
  PlusCircle,
  CheckCircle2,
  Clock,
  AlertTriangle,
  User,
  Users,
} from "lucide-react";

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [query, setQuery] = useState("");
  const [classFilter, setClassFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/students");
      const data = await res.json();
      if (data.success) {
        setStudents(data.students);
      }
    } catch (err) {
      console.error("Failed to load students", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleIssueReceipt = (student: Student) => {
    setSelectedStudent(student);
    setIsModalOpen(true);
  };

  const filtered = students.filter((s) => {
    const matchesClass = classFilter === "ALL" || s.class.includes(classFilter);
    const q = query.toLowerCase().trim();
    const matchesQuery =
      !q ||
      s.fullName.toLowerCase().includes(q) ||
      s.regNumber.toLowerCase().includes(q) ||
      s.parentPhone.includes(q);

    return matchesClass && matchesQuery;
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans">
      <Navbar onOpenIssueModal={() => { setSelectedStudent(null); setIsModalOpen(true); }} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Students & Fee Ledger Directory
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Search any Al-Furqan student to view payment history or issue an official receipt
            </p>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by student name, reg number, or phone..."
              className="w-full h-10 pl-10 pr-4 rounded-xl border border-slate-300 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#075E54]"
            />
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto">
            <span className="text-xs font-bold text-slate-500">Filter Class:</span>
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="h-10 px-3.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#075E54]"
            >
              <option value="ALL">All Classes</option>
              <option value="JSS 1">JSS 1</option>
              <option value="JSS 2">JSS 2</option>
              <option value="JSS 3">JSS 3</option>
              <option value="SS 1">SS 1</option>
              <option value="SS 2">SS 2</option>
              <option value="SS 3">SS 3</option>
            </select>
          </div>
        </div>

        {/* Students Table */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-5 sm:p-7 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-100">
                  <th className="py-3 px-3">Student Name</th>
                  <th className="py-3 px-3">Admission No</th>
                  <th className="py-3 px-3">Class</th>
                  <th className="py-3 px-3">Parent / Phone</th>
                  <th className="py-3 px-3 text-right">Term Bill</th>
                  <th className="py-3 px-3 text-right">Paid to Date</th>
                  <th className="py-3 px-3 text-right">Balance Due</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-3">
                      <div className="font-bold text-slate-900 text-xs">{student.fullName}</div>
                    </td>

                    <td className="py-3.5 px-3 font-mono font-bold text-slate-700">
                      {student.regNumber}
                    </td>

                    <td className="py-3.5 px-3 font-medium text-slate-700">
                      {student.class}
                    </td>

                    <td className="py-3.5 px-3 text-slate-600">
                      <div>{student.parentName}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{student.parentPhone}</div>
                    </td>

                    <td className="py-3.5 px-3 text-right font-mono font-bold text-slate-800">
                      {formatNaira(student.totalTermBill)}
                    </td>

                    <td className="py-3.5 px-3 text-right font-mono font-bold text-emerald-800">
                      {formatNaira(student.totalPaid)}
                    </td>

                    <td className="py-3.5 px-3 text-right font-mono font-bold">
                      <span className={student.balanceRemaining > 0 ? "text-amber-700 font-black" : "text-emerald-700 font-normal"}>
                        {formatNaira(student.balanceRemaining)}
                      </span>
                    </td>

                    <td className="py-3.5 px-3 text-center">
                      {student.status === "FULL" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                          CLEARED
                        </span>
                      ) : student.status === "PARTIAL" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800">
                          PARTIAL
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800">
                          UNPAID
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleIssueReceipt(student)}
                        className="bg-[#075E54] hover:bg-[#128C7E] active:scale-95 text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-2xs transition-all inline-flex items-center gap-1 cursor-pointer"
                      >
                        <PlusCircle className="h-3.5 w-3.5" />
                        <span>Issue Receipt</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <ReceiptModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        preselectedStudent={selectedStudent}
        onReceiptCreated={() => fetchStudents()}
      />
    </div>
  );
}
