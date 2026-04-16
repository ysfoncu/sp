import { useState } from "react";
import { X, User, Mail, FileText, UserCheck, ChevronDown } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Student } from "../types/placementTask";
import { PraksisPlace, QuotaRequest } from "../types/praksisPlace";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

interface SlideOverAssignedStudentsProps {
  isOpen: boolean;
  onClose: () => void;
  quotaRequest: QuotaRequest;
  students: Student[];
  praksisPlace: PraksisPlace;
  onStudentUpdate: (students: Student[]) => void;
}

export function SlideOverAssignedStudents({
  isOpen,
  onClose,
  quotaRequest,
  students,
  praksisPlace,
  onStudentUpdate,
}: SlideOverAssignedStudentsProps) {
  if (!isOpen) return null;

  // Check if placement is published or completed - show students if placement status is "publish" or "completed"
  const isPlacementPublished =
    quotaRequest.placementStatus === "publish" || quotaRequest.placementStatus === "completed";

  // Filter students assigned to this specific quota request
  // Show if placement is published or completed
  const assignedStudents = isPlacementPublished
    ? students.filter(
        (student) =>
          student.assignedPraksisPlace &&
          student.assignedPraksisPlace.placeId === quotaRequest.praksisPlaceId &&
          student.assignedPraksisPlace.departmentId === quotaRequest.departmentId &&
          student.assignedPraksisPlace.placementTaskId === quotaRequest.placementId
      )
    : [];

  // Get supervisors for this department
  const department = praksisPlace.departments.find(
    (d) => d.id === quotaRequest.departmentId
  );
  const supervisors = department?.supervisors || [];

  const handleAssignSupervisor = (studentId: string, supervisorId: string) => {
    const supervisor = supervisors.find((s) => s.id === supervisorId);
    if (!supervisor) return;

    const updatedStudents = students.map((student) =>
      student.id === studentId
        ? {
            ...student,
            supervisor: {
              id: supervisor.id,
              name: supervisor.name,
            },
          }
        : student
    );

    onStudentUpdate(updatedStudents);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />

      {/* Slide Over Panel */}
      <div className="fixed right-0 top-0 h-full w-2/3 bg-white shadow-2xl z-50 flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-purple-50">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <User className="h-5 w-5 text-purple-600" />
              Assigned Students
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {quotaRequest.placementTitle} - {quotaRequest.departmentName}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Summary */}
        <div className="px-6 py-4 bg-purple-25 border-b border-gray-200">
          <div className="flex items-center gap-6">
            <div>
              <p className="text-sm text-gray-600">Total Assigned</p>
              <p className="text-2xl font-bold text-purple-600">
                {assignedStudents.length}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Requested Quota</p>
              <p className="text-2xl font-bold text-gray-900">
                {quotaRequest.requestedQuota}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Available Supervisors</p>
              <p className="text-2xl font-bold text-gray-900">
                {supervisors.length}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {!isPlacementPublished ? (
            <div className="text-center py-12">
              <User className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">Placement Not Yet Completed</p>
              <p className="text-sm text-gray-400 mt-1">
                Students will appear here once the coordinator completes all tasks (7/7)
              </p>
              <p className="text-sm text-gray-400">
                and clicks "Complete and Publish" button
              </p>
            </div>
          ) : assignedStudents.length === 0 ? (
            <div className="text-center py-12">
              <User className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No students assigned yet</p>
              <p className="text-sm text-gray-400 mt-1">
                Students will appear here once the coordinator assigns students
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {assignedStudents.map((student) => (
                <div
                  key={student.id}
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:border-purple-300 transition-colors"
                >
                  {/* Student Info Row */}
                  <div className="grid grid-cols-12 gap-4 items-start">
                    {/* Student Name & Email */}
                    <div className="col-span-3">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                          <User className="h-4 w-4 text-purple-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {student.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            Year {student.year}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-gray-600 mt-2">
                        <Mail className="h-3 w-3" />
                        <span className="text-xs">{student.email}</span>
                      </div>
                    </div>

                    {/* Attached Files */}
                    <div className="col-span-3">
                      <p className="text-xs font-medium text-gray-700 mb-2">
                        Attached Files
                      </p>
                      {student.attachedFiles && student.attachedFiles.length > 0 ? (
                        <div className="space-y-1">
                          {student.attachedFiles.map((file) => (
                            <div
                              key={file.id}
                              className="flex items-center gap-2 text-xs bg-gray-50 rounded px-2 py-1"
                            >
                              <FileText className="h-3 w-3 text-blue-600" />
                              <div className="flex-1 min-w-0">
                                <p className="text-gray-700 truncate">
                                  {file.name}
                                </p>
                                <p className="text-gray-500">
                                  {formatFileSize(file.size)} •{" "}
                                  {formatDate(file.uploadedAt)}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400 italic">
                          No files attached
                        </p>
                      )}
                    </div>

                    {/* Supervisor Assignment */}
                    <div className="col-span-3">
                      <p className="text-xs font-medium text-gray-700 mb-2">
                        Assigned Supervisor
                      </p>
                      <Select
                        value={student.supervisor?.id || ""}
                        onValueChange={(value) =>
                          handleAssignSupervisor(student.id, value)
                        }
                      >
                        <SelectTrigger className="w-full h-9 text-sm">
                          <SelectValue placeholder="Select supervisor">
                            {student.supervisor ? (
                              <div className="flex items-center gap-2">
                                <UserCheck className="h-3 w-3 text-purple-600" />
                                <span>{student.supervisor.name}</span>
                              </div>
                            ) : (
                              "Select supervisor"
                            )}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {supervisors.map((supervisor) => (
                            <SelectItem
                              key={supervisor.id}
                              value={supervisor.id}
                            >
                              <div className="flex flex-col">
                                <span className="font-medium">
                                  {supervisor.name}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {supervisor.specialization}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {student.supervisor && (
                        <div className="mt-2 text-xs text-gray-600">
                          <p className="text-gray-500">
                            {
                              supervisors.find(
                                (s) => s.id === student.supervisor?.id
                              )?.specialization
                            }
                          </p>
                          <p className="text-gray-500">
                            {
                              supervisors.find(
                                (s) => s.id === student.supervisor?.id
                              )?.email
                            }
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Status */}
                    <div className="col-span-3">
                      <p className="text-xs font-medium text-gray-700 mb-2">
                        Status
                      </p>
                      <div className="space-y-1">
                        <Badge
                          variant="outline"
                          className="bg-green-50 text-green-700 border-green-200"
                        >
                          Assigned
                        </Badge>
                        {student.supervisor && (
                          <Badge
                            variant="outline"
                            className="bg-purple-50 text-purple-700 border-purple-200 ml-1"
                          >
                            Supervisor Assigned
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {assignedStudents.length} of {quotaRequest.requestedQuota}{" "}
              students assigned
            </p>
            <Button
              onClick={onClose}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}