🔍 API COMMANDS TO CHECK ALLOCATIONS

Replace YOUR_TOKEN with your actual auth token and run these commands:

# Check allocations for items to be deleted:

# Check 1/10 - ID: YPJiUZGiDeKaLOGHWL06
curl -s -X GET "https://fantopark-backend-150582227311.us-central1.run.app/api/inventory/YPJiUZGiDeKaLOGHWL06/allocations" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImFkbWluIiwiZW1haWwiOiJhZG1pbkBmYW50b3BhcmsuY29tIiwicm9sZSI6InN1cGVyX2FkbWluIiwibmFtZSI6IlN1cGVyIEFkbWluIiwiaWF0IjoxNzUyNTA4MjYwLCJleHAiOjE3NTMxMTMwNjB9.weGRDc3lHHl3bZ4aK2r2ijgOCvT0jzD8wRGLazMx7XI" | jq '.data.allocations | length'

# Check 2/10 - ID: Rn7Qu91GSi3RmwOLdeDB
curl -s -X GET "https://fantopark-backend-150582227311.us-central1.run.app/api/inventory/Rn7Qu91GSi3RmwOLdeDB/allocations" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImFkbWluIiwiZW1haWwiOiJhZG1pbkBmYW50b3BhcmsuY29tIiwicm9sZSI6InN1cGVyX2FkbWluIiwibmFtZSI6IlN1cGVyIEFkbWluIiwiaWF0IjoxNzUyNTA4MjYwLCJleHAiOjE3NTMxMTMwNjB9.weGRDc3lHHl3bZ4aK2r2ijgOCvT0jzD8wRGLazMx7XI" | jq '.data.allocations | length'

# Check 3/10 - ID: FGxrvKc2e3kJvifl4k5v
curl -s -X GET "https://fantopark-backend-150582227311.us-central1.run.app/api/inventory/FGxrvKc2e3kJvifl4k5v/allocations" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImFkbWluIiwiZW1haWwiOiJhZG1pbkBmYW50b3BhcmsuY29tIiwicm9sZSI6InN1cGVyX2FkbWluIiwibmFtZSI6IlN1cGVyIEFkbWluIiwiaWF0IjoxNzUyNTA4MjYwLCJleHAiOjE3NTMxMTMwNjB9.weGRDc3lHHl3bZ4aK2r2ijgOCvT0jzD8wRGLazMx7XI" | jq '.data.allocations | length'

# Check 4/10 - ID: CT5Zx1CwTgQoxdlsXg8L
curl -s -X GET "https://fantopark-backend-150582227311.us-central1.run.app/api/inventory/CT5Zx1CwTgQoxdlsXg8L/allocations" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImFkbWluIiwiZW1haWwiOiJhZG1pbkBmYW50b3BhcmsuY29tIiwicm9sZSI6InN1cGVyX2FkbWluIiwibmFtZSI6IlN1cGVyIEFkbWluIiwiaWF0IjoxNzUyNTA4MjYwLCJleHAiOjE3NTMxMTMwNjB9.weGRDc3lHHl3bZ4aK2r2ijgOCvT0jzD8wRGLazMx7XI" | jq '.data.allocations | length'

# Check 5/10 - ID: B7ltzC1BLK8jfYAE1fEF
curl -s -X GET "https://fantopark-backend-150582227311.us-central1.run.app/api/inventory/B7ltzC1BLK8jfYAE1fEF/allocations" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImFkbWluIiwiZW1haWwiOiJhZG1pbkBmYW50b3BhcmsuY29tIiwicm9sZSI6InN1cGVyX2FkbWluIiwibmFtZSI6IlN1cGVyIEFkbWluIiwiaWF0IjoxNzUyNTA4MjYwLCJleHAiOjE3NTMxMTMwNjB9.weGRDc3lHHl3bZ4aK2r2ijgOCvT0jzD8wRGLazMx7XI" | jq '.data.allocations | length'

# Check 6/10 - ID: mejiulCbp8Git8UQ7Yb2
curl -s -X GET "https://fantopark-backend-150582227311.us-central1.run.app/api/inventory/mejiulCbp8Git8UQ7Yb2/allocations" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImFkbWluIiwiZW1haWwiOiJhZG1pbkBmYW50b3BhcmsuY29tIiwicm9sZSI6InN1cGVyX2FkbWluIiwibmFtZSI6IlN1cGVyIEFkbWluIiwiaWF0IjoxNzUyNTA4MjYwLCJleHAiOjE3NTMxMTMwNjB9.weGRDc3lHHl3bZ4aK2r2ijgOCvT0jzD8wRGLazMx7XI" | jq '.data.allocations | length'

# Check 7/10 - ID: 2G5Hi4GSPUAR9FBmu1sm
curl -s -X GET "https://fantopark-backend-150582227311.us-central1.run.app/api/inventory/2G5Hi4GSPUAR9FBmu1sm/allocations" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImFkbWluIiwiZW1haWwiOiJhZG1pbkBmYW50b3BhcmsuY29tIiwicm9sZSI6InN1cGVyX2FkbWluIiwibmFtZSI6IlN1cGVyIEFkbWluIiwiaWF0IjoxNzUyNTA4MjYwLCJleHAiOjE3NTMxMTMwNjB9.weGRDc3lHHl3bZ4aK2r2ijgOCvT0jzD8wRGLazMx7XI" | jq '.data.allocations | length'

# Check 8/10 - ID: 51NjaERRb2KS1OkUlHmh
curl -s -X GET "https://fantopark-backend-150582227311.us-central1.run.app/api/inventory/51NjaERRb2KS1OkUlHmh/allocations" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImFkbWluIiwiZW1haWwiOiJhZG1pbkBmYW50b3BhcmsuY29tIiwicm9sZSI6InN1cGVyX2FkbWluIiwibmFtZSI6IlN1cGVyIEFkbWluIiwiaWF0IjoxNzUyNTA4MjYwLCJleHAiOjE3NTMxMTMwNjB9.weGRDc3lHHl3bZ4aK2r2ijgOCvT0jzD8wRGLazMx7XI" | jq '.data.allocations | length'

# Check 9/10 - ID: RW39jW8SbBXR4phNAmzl
curl -s -X GET "https://fantopark-backend-150582227311.us-central1.run.app/api/inventory/RW39jW8SbBXR4phNAmzl/allocations" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImFkbWluIiwiZW1haWwiOiJhZG1pbkBmYW50b3BhcmsuY29tIiwicm9sZSI6InN1cGVyX2FkbWluIiwibmFtZSI6IlN1cGVyIEFkbWluIiwiaWF0IjoxNzUyNTA4MjYwLCJleHAiOjE3NTMxMTMwNjB9.weGRDc3lHHl3bZ4aK2r2ijgOCvT0jzD8wRGLazMx7XI" | jq '.data.allocations | length'

# Check 10/10 - ID: 33kRnvOgZpD5LmbJMWno
curl -s -X GET "https://fantopark-backend-150582227311.us-central1.run.app/api/inventory/33kRnvOgZpD5LmbJMWno/allocations" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImFkbWluIiwiZW1haWwiOiJhZG1pbkBmYW50b3BhcmsuY29tIiwicm9sZSI6InN1cGVyX2FkbWluIiwibmFtZSI6IlN1cGVyIEFkbWluIiwiaWF0IjoxNzUyNTA4MjYwLCJleHAiOjE3NTMxMTMwNjB9.weGRDc3lHHl3bZ4aK2r2ijgOCvT0jzD8wRGLazMx7XI" | jq '.data.allocations | length'

# Or check all at once with this script:
TOKEN="YOUR_TOKEN"
echo "Checking allocations for items to be deleted..."
echo -n "ID YPJiUZGiDeKaLOGHWL06: "
curl -s -X GET "https://fantopark-backend-150582227311.us-central1.run.app/api/inventory/YPJiUZGiDeKaLOGHWL06/allocations" -H "Authorization: Bearer $TOKEN" | jq '.data.allocations | length' 2>/dev/null || echo "0"
echo -n "ID Rn7Qu91GSi3RmwOLdeDB: "
curl -s -X GET "https://fantopark-backend-150582227311.us-central1.run.app/api/inventory/Rn7Qu91GSi3RmwOLdeDB/allocations" -H "Authorization: Bearer $TOKEN" | jq '.data.allocations | length' 2>/dev/null || echo "0"
echo -n "ID FGxrvKc2e3kJvifl4k5v: "
curl -s -X GET "https://fantopark-backend-150582227311.us-central1.run.app/api/inventory/FGxrvKc2e3kJvifl4k5v/allocations" -H "Authorization: Bearer $TOKEN" | jq '.data.allocations | length' 2>/dev/null || echo "0"
echo -n "ID CT5Zx1CwTgQoxdlsXg8L: "
curl -s -X GET "https://fantopark-backend-150582227311.us-central1.run.app/api/inventory/CT5Zx1CwTgQoxdlsXg8L/allocations" -H "Authorization: Bearer $TOKEN" | jq '.data.allocations | length' 2>/dev/null || echo "0"
echo -n "ID B7ltzC1BLK8jfYAE1fEF: "
curl -s -X GET "https://fantopark-backend-150582227311.us-central1.run.app/api/inventory/B7ltzC1BLK8jfYAE1fEF/allocations" -H "Authorization: Bearer $TOKEN" | jq '.data.allocations | length' 2>/dev/null || echo "0"
echo -n "ID mejiulCbp8Git8UQ7Yb2: "
curl -s -X GET "https://fantopark-backend-150582227311.us-central1.run.app/api/inventory/mejiulCbp8Git8UQ7Yb2/allocations" -H "Authorization: Bearer $TOKEN" | jq '.data.allocations | length' 2>/dev/null || echo "0"
echo -n "ID 2G5Hi4GSPUAR9FBmu1sm: "
curl -s -X GET "https://fantopark-backend-150582227311.us-central1.run.app/api/inventory/2G5Hi4GSPUAR9FBmu1sm/allocations" -H "Authorization: Bearer $TOKEN" | jq '.data.allocations | length' 2>/dev/null || echo "0"
echo -n "ID 51NjaERRb2KS1OkUlHmh: "
curl -s -X GET "https://fantopark-backend-150582227311.us-central1.run.app/api/inventory/51NjaERRb2KS1OkUlHmh/allocations" -H "Authorization: Bearer $TOKEN" | jq '.data.allocations | length' 2>/dev/null || echo "0"
echo -n "ID RW39jW8SbBXR4phNAmzl: "
curl -s -X GET "https://fantopark-backend-150582227311.us-central1.run.app/api/inventory/RW39jW8SbBXR4phNAmzl/allocations" -H "Authorization: Bearer $TOKEN" | jq '.data.allocations | length' 2>/dev/null || echo "0"
echo -n "ID 33kRnvOgZpD5LmbJMWno: "
curl -s -X GET "https://fantopark-backend-150582227311.us-central1.run.app/api/inventory/33kRnvOgZpD5LmbJMWno/allocations" -H "Authorization: Bearer $TOKEN" | jq '.data.allocations | length' 2>/dev/null || echo "0"
