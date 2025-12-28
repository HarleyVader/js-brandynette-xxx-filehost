# 📚 Documentation Browser - Integration Guide

## Overview

The documentation system is now accessible through:

- **Static files:** `/docs/*.md` - Direct markdown access
- **API endpoint:** `GET /api/docs` - List all documentation files
- **Docs folder:** `docs/` directory with organized markdown files

## Frontend Integration Example

### React Component for Docs Browser

```javascript
function DocsBrowser() {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/docs")
      .then((res) => res.json())
      .then((data) => {
        setDocs(data.docs);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load docs:", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return React.createElement(
      "div",
      { className: "glass-bubble" },
      React.createElement("p", null, "Loading documentation...")
    );
  }

  return React.createElement(
    "div",
    {
      className: "glass-bubble glow-effect",
      style: { padding: "1.5rem", margin: "1rem" },
    },
    React.createElement(
      "h2",
      {
        style: {
          color: "var(--nav-alt)",
          textShadow: "0 0 10px var(--glow-cyan)",
          marginBottom: "1rem",
        },
      },
      "📚 Documentation"
    ),
    React.createElement(
      "div",
      {
        style: {
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: "1rem",
        },
      },
      docs.map((doc) =>
        React.createElement(
          "a",
          {
            key: doc.name,
            href: doc.url,
            target: "_blank",
            className: "bubble-button",
            style: {
              textDecoration: "none",
              padding: "1rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
            },
          },
          React.createElement(
            "span",
            {
              style: {
                fontSize: "1.2rem",
                color: "var(--button-color)",
              },
            },
            "📄"
          ),
          React.createElement(
            "span",
            {
              style: {
                fontWeight: "bold",
                textTransform: "capitalize",
              },
            },
            doc.title
          ),
          React.createElement(
            "span",
            {
              style: {
                fontSize: "0.75rem",
                opacity: 0.7,
              },
            },
            doc.name
          )
        )
      )
    )
  );
}
```

### Add to App Component

```javascript
// In the App component, add a docs section:
React.createElement(
  "section",
  {
    style: { margin: "2rem 0" },
  },
  React.createElement(DocsBrowser)
);
```

## API Response Format

**Endpoint:** `GET /api/docs`

**Response:**

```json
{
  "docs": [
    {
      "name": "README.md",
      "title": "README",
      "url": "/docs/README.md"
    },
    {
      "name": "RTSP-STREAMING.md",
      "title": "RTSP STREAMING",
      "url": "/docs/RTSP-STREAMING.md"
    },
    {
      "name": "RTSP-QUICKSTART.md",
      "title": "RTSP QUICKSTART",
      "url": "/docs/RTSP-QUICKSTART.md"
    },
    {
      "name": "PRODUCTION-FIX.md",
      "title": "PRODUCTION FIX",
      "url": "/docs/PRODUCTION-FIX.md"
    }
  ],
  "count": 4
}
```

## Direct Markdown Access

Users can directly access markdown files:

- `http://localhost:6969/docs/README.md`
- `http://localhost:6969/docs/RTSP-STREAMING.md`
- `http://localhost:6969/docs/PRODUCTION-FIX.md`

Browsers will either render markdown (some do) or offer download.

## Enhanced Markdown Rendering (Future)

For HTML rendering of markdown, consider adding:

### Option 1: Client-Side Rendering

```javascript
// Use marked.js for markdown → HTML
import marked from "https://cdn.jsdelivr.net/npm/marked/marked.min.js";

fetch("/docs/README.md")
  .then((res) => res.text())
  .then((markdown) => {
    const html = marked.parse(markdown);
    document.getElementById("doc-content").innerHTML = html;
  });
```

### Option 2: Server-Side Rendering

```javascript
// Add to server.js
import { marked } from "marked";

app.get("/docs/:filename", (req, res) => {
  const filename = req.params.filename;
  const mdPath = path.join(__dirname, "../docs", filename);

  if (req.query.format === "html") {
    const markdown = fs.readFileSync(mdPath, "utf-8");
    const html = marked.parse(markdown);
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${filename}</title>
          <link rel="stylesheet" href="/css/variables.css">
          <link rel="stylesheet" href="/css/reset.css">
        </head>
        <body>${html}</body>
      </html>
    `);
  } else {
    res.sendFile(mdPath);
  }
});
```

## Current Setup

✅ **Completed:**

- Created `docs/` folder structure
- Moved documentation files to `docs/`
- Created comprehensive `docs/README.md` index
- Added `/api/docs` endpoint
- Static file serving for `/docs/*` routes
- Updated main README with docs links

🔄 **Optional Next Steps:**

- Add DocsBrowser component to frontend
- Implement markdown → HTML rendering
- Add search functionality for docs
- Create interactive API explorer
