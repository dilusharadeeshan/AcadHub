/**
 * Redirect to the main page that shows all courses.
 *   GET /api/courses
 */
export const getCourse = (req, res) => {
  const targetUrl =
    process.env.COURSE_CATALOG_URL || "http://localhost:5173/catalog";

  return res.redirect(302, targetUrl);
};