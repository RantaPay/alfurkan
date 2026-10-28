"use client";
import { useApiResource } from "@/features/shared/useApiResource";

import { detectStudentCategory } from "@/lib/student-importer";
import { Student } from "@/lib/types";
import { useState } from "react";



export function useStudentsPage() {
  const { data, loading, error, reload: fetchStudents } = useApiResource<{ students: Student[] }>("/api/students");
  const students = data?.students || [];
  const [query, setQuery] = useState("");
  const [classFilter, setClassFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPromotionModalOpen, setIsPromotionModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const handleIssueReceipt = (student: Student) => {
    setSelectedStudent(student);
    setIsModalOpen(true);
  };

  const filtered = students.filter((s) => {
    const matchesClass = classFilter === "ALL" || s.class.includes(classFilter);
    const cat = detectStudentCategory(s.fullName);
    const matchesCategory =
      categoryFilter === "ALL" ||
      (categoryFilter === "SR" && cat === "SR") ||
      (categoryFilter === "YR" && cat === "YR") ||
      (categoryFilter === "DUAL" && cat === "DUAL_SR_YR") ||
      (categoryFilter === "ADF" && cat === "ADF") ||
      (categoryFilter === "REGULAR" && cat === "REGULAR");

    const isAdf = cat === "ADF" || s.totalTermBill === 0;
    const isFull = s.status === "FULL" || isAdf;
    const isPartial = !isAdf && s.status === "PARTIAL";
    const isUnpaid = !isAdf && s.status === "UNPAID" && s.totalTermBill > 0;

    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "FULL" && isFull) ||
      (statusFilter === "PARTIAL" && isPartial) ||
      (statusFilter === "UNPAID" && isUnpaid);

    const q = query.toLowerCase().trim();
    const matchesQuery =
      !q ||
      s.fullName.toLowerCase().includes(q) ||
      s.regNumber.toLowerCase().includes(q) ||
      (s.parentName && s.parentName.toLowerCase().includes(q)) ||
      s.parentPhone.includes(q);

    return matchesClass && matchesCategory && matchesStatus && matchesQuery;
  });


  return { error, students, query, setQuery, classFilter, setClassFilter, categoryFilter, setCategoryFilter, statusFilter, setStatusFilter, loading, selectedStudent, setSelectedStudent, editingStudent, setEditingStudent, isModalOpen, setIsModalOpen, isAddModalOpen, setIsAddModalOpen, isEditModalOpen, setIsEditModalOpen, isPromotionModalOpen, setIsPromotionModalOpen, isImportModalOpen, setIsImportModalOpen, fetchStudents, handleIssueReceipt, filtered };
}
