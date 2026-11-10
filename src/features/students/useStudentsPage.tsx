"use client";
import { useApiResource } from "@/features/shared/useApiResource";
import { usePageQuery } from "@/features/shared/usePageQuery";

import { detectStudentCategory } from "@/lib/student-importer";
import { Student } from "@/lib/types";
import { useState } from "react";

const CATEGORIES = new Set(["ALL", "REGULAR", "SR", "YR", "DUAL", "BOT", "ADF"]);
const STATUSES = new Set(["ALL", "FULL", "PARTIAL", "UNPAID"]);

export function useStudentsPage() {
  const { data, loading, error, reload: fetchStudents } = useApiResource<{ students: Student[] }>("/api/students");
  const students = data?.students || [];
  const [filters, updateFilters] = usePageQuery({ q: "", category: "ALL", status: "ALL", class: "ALL" });
  const query = filters.q;
  const categoryFilter = CATEGORIES.has(filters.category) ? filters.category : "ALL";
  const statusFilter = STATUSES.has(filters.status) ? filters.status : "ALL";
  const classFilter = filters.class || "ALL";
  const setQuery = (q: string) => updateFilters({ q });
  const setCategoryFilter = (category: string) => updateFilters({ category });
  const setStatusFilter = (status: string) => updateFilters({ status });
  const setClassFilter = (value: string) => updateFilters({ class: value });
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
      (categoryFilter === "BOT" && cat === "BOT") ||
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
