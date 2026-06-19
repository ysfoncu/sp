// Aggregation helpers for the Students page — join a student (by id) across
// placement task states, placements, and priority applications.

import { Student } from "../types/placementTask";
import { PlacementTaskState, StudentPlacement } from "../types/studentPlacement";
import { PriorityPlacementApplication } from "../types/priorityPlacement";

export interface StudentPlacementRecord {
  key: string;
  term: string;
  title?: string;
  subject?: string;
  placeName?: string;
  unitName?: string;
  supervisors: { id?: string; name: string }[];
  startDate?: string;
  endDate?: string;
  status?: string;
}

export interface StudentSummary {
  placementCount: number;
  hasPlacement: boolean;
  priorityCount: number;
  pendingPriorityCount: number;
  totalPriorityPoints: number;
}

function fmtTerm(semester?: string, year?: string): string {
  return [semester, year].filter(Boolean).join(" ").trim();
}

/**
 * All placements a student has been part of — merged from the student entry in
 * each PlacementTaskState (assigned place/department/supervisors + the
 * placement metadata) and the student's own placementHistory[]. Deduped by
 * placement id.
 */
export function getStudentPlacements(
  studentId: string,
  placementTaskStates: PlacementTaskState[],
  studentPlacements: StudentPlacement[],
): StudentPlacementRecord[] {
  const byKey = new Map<string, StudentPlacementRecord>();

  placementTaskStates.forEach((ts) => {
    const student = (ts.students as Student[] | undefined)?.find(
      (s) => s.id === studentId,
    );
    if (!student) return;

    const placement = studentPlacements.find((p) => p.id === ts.placementId);
    const ap = student.assignedPraksisPlace;
    const supervisors =
      student.supervisors && student.supervisors.length > 0
        ? student.supervisors
        : student.supervisor
        ? [student.supervisor]
        : [];

    byKey.set(ts.placementId, {
      key: ts.placementId,
      term: placement ? fmtTerm(placement.semester, placement.year) : "",
      title: placement?.title ?? ap?.placementTitle,
      subject: placement?.subject,
      placeName: ap?.placeName,
      unitName: ap?.departmentName,
      supervisors,
      startDate: ap?.startDate ?? placement?.startDate,
      endDate: ap?.endDate ?? placement?.endDate,
      status: placement?.status ?? ap?.approvalStatus,
    });

    // Merge in the student's self-contained placement history
    (student.placementHistory ?? []).forEach((h) => {
      const existing = byKey.get(h.placementId);
      if (existing) {
        existing.term = existing.term || fmtTerm(h.semester, h.year);
        existing.subject = existing.subject || h.emne;
        existing.placeName = existing.placeName || h.praksisPlaceName;
        existing.unitName = existing.unitName || h.unitName;
        existing.status = existing.status || h.status;
      } else {
        byKey.set(h.placementId, {
          key: h.placementId,
          term: fmtTerm(h.semester, h.year),
          subject: h.emne,
          placeName: h.praksisPlaceName,
          unitName: h.unitName,
          supervisors: [],
          status: h.status,
        });
      }
    });
  });

  return Array.from(byKey.values());
}

export function getStudentPriorityRequests(
  studentId: string,
  priorityApplications: PriorityPlacementApplication[],
): PriorityPlacementApplication[] {
  return priorityApplications
    .filter((a) => a.studentId === studentId)
    .sort((a, b) => (a.submittedDate < b.submittedDate ? 1 : -1));
}

export function getStudentSummary(
  studentId: string,
  placementTaskStates: PlacementTaskState[],
  studentPlacements: StudentPlacement[],
  priorityApplications: PriorityPlacementApplication[],
): StudentSummary {
  const placements = getStudentPlacements(
    studentId,
    placementTaskStates,
    studentPlacements,
  );
  const reqs = getStudentPriorityRequests(studentId, priorityApplications);
  return {
    placementCount: placements.length,
    hasPlacement: placements.length > 0,
    priorityCount: reqs.length,
    pendingPriorityCount: reqs.filter((r) => r.status === "pending").length,
    totalPriorityPoints: reqs.reduce((sum, r) => sum + (r.totalPoints || 0), 0),
  };
}

export interface StudentsOverview {
  total: number;
  placed: number;
  awaiting: number;
  pendingPriorityRequests: number;
}

export function getStudentsOverview(
  students: { id: string }[],
  placementTaskStates: PlacementTaskState[],
  studentPlacements: StudentPlacement[],
  priorityApplications: PriorityPlacementApplication[],
): StudentsOverview {
  let placed = 0;
  students.forEach((s) => {
    if (
      getStudentPlacements(s.id, placementTaskStates, studentPlacements).length >
      0
    )
      placed += 1;
  });
  return {
    total: students.length,
    placed,
    awaiting: students.length - placed,
    pendingPriorityRequests: priorityApplications.filter(
      (a) => a.status === "pending",
    ).length,
  };
}
