import { useQuery } from "@tanstack/react-query";
import { courseService } from "../services/courseService";

export const useCoursesQuery = () =>
  useQuery({
    queryKey: ["courses"],
    queryFn: courseService.getCourses,
  });
