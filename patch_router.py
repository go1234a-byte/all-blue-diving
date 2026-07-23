import pathlib
p = pathlib.Path("src/router.tsx")
text = p.read_text(encoding="utf-8")

anchor1 = 'import InstructorConsole from "./pages/InstructorConsole";'
assert anchor1 in text, "anchor1 not found"
text = text.replace(
    anchor1,
    anchor1 + '\nimport TourEditPage from "./pages/TourEditPage";',
    1,
)

anchor2 = '''          { index: true, name: "instructor-console", element: <InstructorConsole /> },
          { path: "arbitration", name: "instructor-arbitration", element: <InstructorArbitrationRoom /> },'''
assert anchor2 in text, "anchor2 not found"
replacement2 = '''          { index: true, name: "instructor-console", element: <InstructorConsole /> },
          { path: "tours/:tourId/edit", name: "instructor-tour-edit", element: <TourEditPage /> },
          { path: "arbitration", name: "instructor-arbitration", element: <InstructorArbitrationRoom /> },'''
text = text.replace(anchor2, replacement2, 1)

p.write_text(text, encoding="utf-8")
print("OK: router.tsx patched")
