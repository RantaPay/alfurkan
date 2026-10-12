"use client";

import { useState, useEffect } from "react";
import { SidebarLayout } from "@/components/layout/SidebarLayout";
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
  UserPlus,
  Edit2,
  GraduationCap,
  FileSpreadsheet,
} from "lucide-react";
import { AddStudentModal } from "@/components/students/AddStudentModal";
import { EditStudentModal } from "@/components/students/EditStudentModal";
import { SessionPromotionModal } from "@/components/students/SessionPromotionModal";
import { DatabaseImportModal } from "@/components/students/DatabaseImportModal";
import { AuthGuard } from "@/components/auth/AuthGuard";

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [query, setQuery] = useState("");
  const [classFilter, setClassFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPromotionModalOpen, setIsPromotionModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

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
    <AuthGuard>
      <SidebarLayout onOpenIssueModal={() => { setSelectedStudent(null); setIsModalOpen(true); }}>
        <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Students & Fee Ledger Directory
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Search any Al-Furqan student to view payment history or issue a receipt
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setIsImportModalOpen(true)}
              className="bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-300 text-emerald-950 px-4 py-2.5 rounded-xl text-sm font-bold shadow-xs transition-all flex items-center gap-2 cursor-pointer"
              title="Upload student list spreadsheet"
            >
              <FileSpreadsheet className="h-4.5 w-4.5 text-[#075E54]" />
              <span>Upload Student List (Excel)</span>
            </button>

            <button
              type="button"
              onClick={() => setIsPromotionModalOpen(true)}
              className="bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 px-4 py-2.5 rounded-xl text-sm font-bold shadow-xs transition-all flex items-center gap-2 cursor-pointer"
              title="Promote students to next class for a new academic session"
            >
              <GraduationCap className="h-4.5 w-4.5 text-[#075E54]" />
              <span>Promote Students</span>
            </button>

            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="bg-[#075E54] hover:bg-[#128C7E] active:scale-95 text-white px-4.5 py-2.5 rounded-xl text-sm font-black shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <UserPlus className="h-4.5 w-4.5" />
              <span>Enroll Student</span>
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by student name, reg number, or phone..."
              className="w-full h-11 pl-11 pr-4 rounded-xl border border-slate-300 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#075E54]"
            />
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto">
            <span className="text-sm font-bold text-slate-500">Filter Class:</span>
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              disabled={loading}
              className="h-11 px-3.5 rounded-xl border border-slate-300 text-sm font-bold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#075E54] cursor-pointer max-w-xs truncate disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <option value="ALL">
                {loading ? "All Classes" : `All Classes (${students.length})`}
              </option>
              {!loading &&
                Array.from(new Set(students.map((s) => s.class)))
                  .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
                  .map((cls) => (
                    <option key={cls} value={cls}>
                      {cls} ({students.filter((s) => s.class === cls).length})
                    </option>
                  ))}
            </select>
          </div>
        </div>

        {/* Students Table */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-5 sm:p-7 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="text-slate-500 font-bold uppercase text-xs tracking-wider border-b border-slate-100">
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
                {loading ? (
                  <tr>
                    <td colSpan={9} className="py-28 text-center">
                      <div className="flex items-center justify-center py-8">
                        <div className="h-10 w-10 border-4 border-[#075E54] border-t-transparent rounded-full animate-spin" />
                      </div>
                    </td>
                  </tr>
                ) : filtered.length > 0 ? (
                  filtered.map((student) => (
                    <tr key={student.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-3">
                        <div className="font-bold text-slate-900 text-sm sm:text-base">{student.fullName}</div>
                      </td>

                      <td className="py-3.5 px-3 font-mono font-bold text-slate-700 text-sm">
                        {student.regNumber}
                      </td>

                      <td className="py-3.5 px-3 font-medium text-slate-700 text-sm">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-slate-900">{student.class}</span>
                          {student.isRepeating && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300">
                              Repeating
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-3 text-slate-600">
                        <div className="font-medium text-slate-800 text-sm">{student.parentName}</div>
                        <div className="text-xs text-slate-400 font-mono">{student.parentPhone}</div>
                      </td>

                      <td className="py-3.5 px-3 text-right font-mono font-bold text-slate-800 text-sm sm:text-base">
                        {student.totalTermBill > 0 ? formatNaira(student.totalTermBill) : "—"}
                      </td>

                      <td className="py-3.5 px-3 text-right font-mono font-bold text-emerald-800 text-sm sm:text-base">
                        {student.totalPaid > 0 ? formatNaira(student.totalPaid) : "—"}
                      </td>

                      <td className="py-3.5 px-3 text-right font-mono font-bold text-sm sm:text-base">
                        <span className={student.balanceRemaining > 0 ? "text-amber-700 font-black" : "text-slate-400 font-normal"}>
                          {student.totalTermBill === 0
                            ? "—"
                            : student.balanceRemaining > 0
                            ? formatNaira(student.balanceRemaining)
                            : "₦0"}
                        </span>
                      </td>

                      <td className="py-3.5 px-3 text-center">
                        {student.totalTermBill === 0 ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
                            Nil
                          </span>
                        ) : student.status === "FULL" ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800">
                            CLEARED
                          </span>
                        ) : student.status === "PARTIAL" ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-800">
                            PARTIAL
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-rose-100 text-rose-800">
                            UNPAID
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingStudent(student);
                              setIsEditModalOpen(true);
                            }}
                            className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all cursor-pointer border border-transparent hover:border-slate-200"
                            title="Edit Student & Class Placement (Repeating Status)"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleIssueReceipt(student)}
                            className="bg-[#075E54] hover:bg-[#128C7E] active:scale-95 text-white px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold shadow-2xs transition-all inline-flex items-center gap-1.5 cursor-pointer shrink-0"
                          >
                            <PlusCircle className="h-4 w-4" />
                            <span>Issue Receipt</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-500 text-sm">
                      <div className="max-w-md mx-auto space-y-2">
                        <Users className="h-8 w-8 text-slate-400 mx-auto" />
                        <p className="font-bold text-slate-700">No students found</p>
                        <p className="text-xs text-slate-400">
                          {query || classFilter !== "ALL"
                            ? "Try adjusting your search query or class filter"
                            : "Click 'Upload Student List (Excel)' above to import your spreadsheet or 'Enroll Student' to add individual records."}
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
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

      <AddStudentModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onStudentAdded={() => fetchStudents()}
      />

      <EditStudentModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingStudent(null);
        }}
        student={editingStudent}
        onStudentUpdated={() => fetchStudents()}
      />

      <SessionPromotionModal
        isOpen={isPromotionModalOpen}
        onClose={() => setIsPromotionModalOpen(false)}
        students={students}
        onPromotionComplete={() => fetchStudents()}
      />

      <DatabaseImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportSuccess={() => fetchStudents()}
      />
      </SidebarLayout>
    </AuthGuard>
  );
}
