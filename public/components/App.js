// Main App Component
function App() {
  const { useState, useEffect } = React;
  const [videos, setVideos] = useState([]);
  const [publicFiles, setPublicFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [ticketId, setTicketId] = useState(null);

  useEffect(() => {
    if (hasAccess) {
      fetchData();
    }
  }, [hasAccess]);

  const handleAccessGranted = (ticket) => {
    setTicketId(ticket);
    setHasAccess(true);
  };

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch videos
      const videosResponse = await fetch("/api/videos");
      if (!videosResponse.ok) throw new Error("Failed to fetch videos");
      const videosData = await videosResponse.json();
      setVideos(videosData.videos);

      // Fetch public files
      const publicResponse = await fetch("/api/public");
      if (!publicResponse.ok) throw new Error("Failed to fetch public files");
      const publicData = await publicResponse.json();
      setPublicFiles(publicData.files);

      // Auto-select first video
      if (videosData.videos.length > 0) {
        setSelectedVideo(videosData.videos[0]);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to load data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Show queue modal if no access
  if (!hasAccess) {
    return React.createElement(QueueModal, {
      onAccessGranted: handleAccessGranted,
    });
  }

  // Show loading after access granted
  if (loading) {
    return React.createElement(
      "div",
      {
        style: {
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          color: "white",
          textAlign: "center",
        },
      },
      React.createElement("div", {
        style: {
          width: "50px",
          height: "50px",
          border: "4px solid rgba(255,255,255,0.3)",
          borderTop: "4px solid white",
          borderRadius: "50%",
          animation: "spin 1s linear infinite",
          marginBottom: "1rem",
        },
      }),
      React.createElement("p", null, "Loading videos...")
    );
  }

  return React.createElement(
    "div",
    { style: { minHeight: "100vh", color: "white" } },
    React.createElement(
      "header",
      {
        className: "glass-bubble glow-effect",
        style: {
          textAlign: "center",
          padding: "0.5rem",
          margin: "0.2rem",
        },
      },
      React.createElement(
        "h1",
        {
          style: {
            margin: "0 0 0.5rem 0",
            fontSize: "2.5rem",
            fontWeight: "700",
            textShadow: "2px 2px 4px rgba(0,0,0,0.5)",
            fontFamily: "Audiowide, sans-serif",
            color: "var(--nav-alt)",
            textTransform: "uppercase",
            letterSpacing: "2.5px",
          },
        },
        "🎬 Brandynette's FileHost"
      ),
      React.createElement(
        "div",
        {
          style: {
            margin: "0.5rem 0",
            overflow: "hidden",
            background:
              "linear-gradient(90deg, rgba(0,0,0,0.8), rgba(138,43,226,0.3), rgba(0,0,0,0.8))",
            border: "2px solid var(--glow-purple)",
            borderRadius: "8px",
            padding: "0.5rem 0",
            boxShadow:
              "0 0 20px rgba(138,43,226,0.6), inset 0 0 20px rgba(255,0,255,0.2)",
          },
        },
        React.createElement(
          "div",
          {
            style: {
              display: "inline-block",
              whiteSpace: "nowrap",
              animation: "scroll-left 20s linear infinite",
              fontSize: "1rem",
              fontWeight: "bold",
              fontFamily: "Audiowide, sans-serif",
              background:
                "linear-gradient(90deg, var(--glow-cyan), var(--glow-pink), var(--glow-purple), var(--glow-cyan))",
              backgroundSize: "200% 100%",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              textShadow: "none",
              filter:
                "drop-shadow(0 0 8px var(--glow-cyan)) drop-shadow(0 0 12px var(--glow-pink))",
            },
          },
          "⚡ BREAKING: Premium video streaming NOW LIVE on port 7878 ⚡ Unlimited concurrent viewers ⚡ Browser-cached playback ⚡ Download queue: 3-5 concurrent ⚡ Zero-build CDN architecture ⚡ Cyber goth neon aesthetics ⚡ HTTP Range request support ⚡ Glass morphism UI ⚡ React 18 + Babel transpilation ⚡ ES6 modules ⚡ "
        )
      )
    ),
    // Download Status Component
    React.createElement(DownloadStatus),
    React.createElement(
      "main",
      {
        className: "compact-container",
        style: { maxWidth: "1200px", margin: "0 auto" },
      },
      videos.length === 0
        ? React.createElement(
            "div",
            { style: { textAlign: "center", padding: "3rem 1rem" } },
            React.createElement(
              "h2",
              { style: { color: "#ffd93d" } },
              "No videos found"
            ),
            React.createElement(
              "p",
              null,
              "Please add video files to the BRANDIFICATION folder"
            )
          )
        : React.createElement(
            "div",
            {
              style: {
                display: "flex",
                gap: "1rem",
                alignItems: "flex-start",
                flexWrap: "wrap",
              },
            },
            // Left sidebar - Video selection
            videos.length > 1 &&
              React.createElement(
                "div",
                {
                  className: "glass-bubble glow-effect",
                  style: {
                    flex: "0 0 280px",
                    padding: "1rem",
                    maxHeight: "80vh",
                    overflowY: "auto",
                    position: "sticky",
                    top: "1rem",
                  },
                },
                React.createElement(
                  "h3",
                  {
                    style: {
                      marginBottom: "1rem",
                      textAlign: "center",
                      color: "var(--nav-alt)",
                      fontSize: "1.1rem",
                      textShadow: "0 0 10px var(--glow-cyan)",
                    },
                  },
                  "📁 Select a video:"
                ),
                React.createElement(
                  "div",
                  {
                    className: "no-spacing",
                    style: {
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.5rem",
                    },
                  },
                  videos.map((video) =>
                    React.createElement(
                      "button",
                      {
                        key: video.filename,
                        onClick: () => setSelectedVideo(video),
                        className:
                          selectedVideo?.filename === video.filename
                            ? "bubble-button selected glow-effect"
                            : "bubble-button",
                        style: {
                          fontSize: "0.7rem",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "flex-start",
                          gap: "0.2rem",
                          textAlign: "left",
                          width: "100%",
                        },
                      },
                      React.createElement(
                        "span",
                        {
                          style: {
                            wordBreak: "break-word",
                            width: "100%",
                          },
                        },
                        video.filename
                      ),
                      React.createElement(
                        "span",
                        {
                          style: {
                            fontSize: "0.6rem",
                            opacity: 0.7,
                            color: "var(--primary-alt)",
                          },
                        },
                        `${video.sizeMB} MB`
                      )
                    )
                  )
                )
              ),
            // Right content - Video player
            React.createElement(
              "div",
              {
                style: {
                  flex: "1 1 600px",
                  minWidth: 0,
                },
              },
              // Navigation Bar - Folders
              React.createElement(
                "nav",
                {
                  className: "glass-bubble glow-effect compact-container",
                  style: {
                    margin: "0 0 1rem 0",
                    padding: "0.75rem 1rem",
                    display: "flex",
                    justifyContent: "center",
                    gap: "1rem",
                    flexWrap: "wrap",
                    background:
                      "linear-gradient(135deg, rgba(12, 42, 42, 0.4), rgba(64, 0, 47, 0.4))",
                    border: "2px solid rgba(23, 219, 216, 0.6)",
                    boxShadow:
                      "0 0 30px rgba(0, 255, 255, 0.3), 0 0 60px rgba(138, 43, 226, 0.2)",
                    backdropFilter: "blur(20px)",
                  },
                },
                React.createElement(
                  "a",
                  {
                    href: "#images",
                    style: {
                      color: "#00FF7F",
                      textDecoration: "none",
                      fontSize: "0.9rem",
                      fontWeight: "bold",
                      textShadow: "0 0 8px #00FF00",
                      transition: "all 0.3s ease",
                      padding: "0.5rem 1rem",
                      border: "1px solid rgba(0, 255, 127, 0.5)",
                      borderRadius: "8px",
                      background: "rgba(0, 255, 127, 0.1)",
                    },
                    onMouseEnter: (e) => {
                      e.target.style.textShadow =
                        "0 0 15px #00FF00, 0 0 30px #7FFF00";
                      e.target.style.background = "rgba(0, 255, 127, 0.2)";
                    },
                    onMouseLeave: (e) => {
                      e.target.style.textShadow = "0 0 8px #00FF00";
                      e.target.style.background = "rgba(0, 255, 127, 0.1)";
                    },
                  },
                  "🖼️ Images"
                ),
                React.createElement(
                  "a",
                  {
                    href: "#streams",
                    style: {
                      color: "var(--glow-cyan)",
                      textDecoration: "none",
                      fontSize: "0.9rem",
                      fontWeight: "bold",
                      textShadow: "0 0 8px var(--glow-cyan)",
                      transition: "all 0.3s ease",
                      padding: "0.5rem 1rem",
                      border: "1px solid rgba(0, 255, 255, 0.5)",
                      borderRadius: "8px",
                      background: "rgba(0, 255, 255, 0.1)",
                    },
                    onMouseEnter: (e) => {
                      e.target.style.textShadow =
                        "0 0 15px var(--glow-cyan), 0 0 30px var(--glow-cyan)";
                      e.target.style.background = "rgba(0, 255, 255, 0.2)";
                    },
                    onMouseLeave: (e) => {
                      e.target.style.textShadow = "0 0 8px var(--glow-cyan)";
                      e.target.style.background = "rgba(0, 255, 255, 0.1)";
                    },
                  },
                  "📡 Streams"
                ),
                React.createElement(
                  "a",
                  {
                    href: "#videos",
                    style: {
                      color: "#FF1493",
                      textDecoration: "none",
                      fontSize: "0.9rem",
                      fontWeight: "bold",
                      textShadow: "0 0 8px #FF00FF",
                      transition: "all 0.3s ease",
                      padding: "0.5rem 1rem",
                      border: "1px solid rgba(255, 20, 147, 0.5)",
                      borderRadius: "8px",
                      background: "rgba(255, 20, 147, 0.1)",
                    },
                    onMouseEnter: (e) => {
                      e.target.style.textShadow =
                        "0 0 15px #FF00FF, 0 0 30px #FF1493";
                      e.target.style.background = "rgba(255, 20, 147, 0.2)";
                    },
                    onMouseLeave: (e) => {
                      e.target.style.textShadow = "0 0 8px #FF00FF";
                      e.target.style.background = "rgba(255, 20, 147, 0.1)";
                    },
                  },
                  "🎥 Videos"
                )
              ),
              selectedVideo &&
                React.createElement(
                  "div",
                  {
                    className: "glass-bubble",
                    style: {
                      margin: "0 0 1rem 0",
                      padding: "0.75rem 1rem",
                      background:
                        "linear-gradient(135deg, rgba(12, 42, 42, 0.5), rgba(64, 0, 47, 0.5))",
                      border: "2px solid rgba(255, 20, 147, 0.6)",
                      boxShadow:
                        "0 0 20px rgba(255, 0, 255, 0.4), 0 0 40px rgba(138, 43, 226, 0.2)",
                      backdropFilter: "blur(15px)",
                    },
                  },
                  React.createElement(
                    "h2",
                    {
                      style: {
                        margin: 0,
                        fontSize: "1.2rem",
                        fontWeight: "bold",
                        color: "#FF1493",
                        textShadow: "0 0 10px #FF00FF, 0 0 20px #FF1493",
                        textAlign: "center",
                      },
                    },
                    `🎬 ${selectedVideo.filename}`
                  )
                ),
              selectedVideo &&
                React.createElement(VideoPlayer, {
                  videoSrc: `/videos/${selectedVideo.filename}?ticket=${ticketId}`,
                  title: selectedVideo.filename,
                })
            )
          )
    ),
    React.createElement(
      "footer",
      {
        className: "glass-bubble compact-container",
        style: {
          textAlign: "center",
          margin: "1rem auto",
          maxWidth: "1200px",
          fontSize: "0.9rem",
          lineHeight: "1.6",
          background:
            "linear-gradient(135deg, rgba(12, 42, 42, 0.4), rgba(64, 0, 47, 0.4))",
          border: "2px solid rgba(23, 219, 216, 0.6)",
          boxShadow:
            "0 0 40px rgba(0, 255, 255, 0.4), 0 0 80px rgba(138, 43, 226, 0.3), inset 0 0 30px rgba(0, 255, 255, 0.15)",
          backdropFilter: "blur(25px)",
        },
      },
      // Special Thanks section
      React.createElement(
        "div",
        {
          style: {
            borderTop: "2px solid rgba(21, 170, 181, 0.5)",
            paddingTop: "1.5rem",
            marginBottom: "1.5rem",
            background: "rgba(21, 170, 181, 0.05)",
            padding: "1.5rem 1rem",
            borderRadius: "12px",
          },
        },
        React.createElement(
          "p",
          {
            style: {
              fontSize: "1.1rem",
              marginBottom: "1rem",
              color: "#00FF7F",
              fontWeight: "bold",
              textShadow:
                "0 0 15px #00FF00, 0 0 30px #7FFF00, 0 0 45px #00FFFF",
              letterSpacing: "1.25px",
            },
          },
          "🙏 Special Thanks To:"
        ),
        React.createElement(
          "div",
          {
            style: {
              display: "flex",
              justifyContent: "center",
              gap: "2rem",
              flexWrap: "wrap",
            },
          },
          React.createElement(
            "a",
            {
              href: "https://bambisleep.info",
              style: {
                color: "var(--glow-purple)",
                textDecoration: "none",
                fontSize: "0.9rem",
                fontWeight: "bold",
                textShadow: "0 0 8px var(--glow-purple)",
                transition: "all 0.3s ease",
                padding: "0.5rem 1rem",
                border: "1px solid rgba(138, 43, 226, 0.5)",
                borderRadius: "8px",
                background: "rgba(138, 43, 226, 0.1)",
              },
              target: "_blank",
              onMouseEnter: (e) => {
                e.target.style.textShadow =
                  "0 0 15px var(--glow-purple), 0 0 30px var(--glow-purple)";
                e.target.style.background = "rgba(138, 43, 226, 0.2)";
              },
              onMouseLeave: (e) => {
                e.target.style.textShadow = "0 0 8px var(--glow-purple)";
                e.target.style.background = "rgba(138, 43, 226, 0.1)";
              },
            },
            "📚 BambiSleep Wiki"
          ),
          React.createElement(
            "a",
            {
              href: "https://bambicloud.com",
              style: {
                color: "var(--glow-cyan)",
                textDecoration: "none",
                fontSize: "0.9rem",
                fontWeight: "bold",
                textShadow: "0 0 8px var(--glow-cyan)",
                transition: "all 0.3s ease",
                padding: "0.5rem 1rem",
                border: "1px solid rgba(0, 255, 255, 0.5)",
                borderRadius: "8px",
                background: "rgba(0, 255, 255, 0.1)",
              },
              target: "_blank",
              onMouseEnter: (e) => {
                e.target.style.textShadow =
                  "0 0 15px var(--glow-cyan), 0 0 30px var(--glow-cyan)";
                e.target.style.background = "rgba(0, 255, 255, 0.2)";
              },
              onMouseLeave: (e) => {
                e.target.style.textShadow = "0 0 8px var(--glow-cyan)";
                e.target.style.background = "rgba(0, 255, 255, 0.1)";
              },
            },
            "☁️ Bambi Cloud"
          )
        )
      ),

      // Main Projects section
      React.createElement(
        "div",
        {
          style: {
            borderTop: "2px solid rgba(223, 4, 113, 0.5)",
            paddingTop: "1.5rem",
            background: "rgba(223, 4, 113, 0.08)",
            padding: "1.5rem 1rem",
            borderRadius: "12px",
          },
        },
        React.createElement(
          "p",
          {
            style: {
              fontSize: "1.1rem",
              marginBottom: "1rem",
              color: "#FF1493",
              fontWeight: "bold",
              textShadow:
                "0 0 15px #FF00FF, 0 0 30px #FF1493, 0 0 45px #FF69B4",
              letterSpacing: "1.25px",
            },
          },
          "🚀 Main Projects:"
        ),
        React.createElement(
          "div",
          {
            style: {
              display: "flex",
              justifyContent: "center",
              gap: "1.5rem",
              flexWrap: "wrap",
              marginTop: "1rem",
            },
          },
          React.createElement(
            "a",
            {
              href: "https://bambisleep.chat",
              style: {
                color: "#ffffff",
                textDecoration: "none",
                fontSize: "0.85rem",
                fontWeight: "bold",
                padding: "0.75rem 1.5rem",
                background:
                  "linear-gradient(135deg, rgba(223, 4, 113, 0.3), rgba(255, 0, 255, 0.3))",
                border: "2px solid var(--button-color)",
                borderRadius: "12px",
                boxShadow: "0 0 15px rgba(223, 4, 113, 0.5)",
                textShadow: "0 0 8px var(--glow-pink)",
                transition: "all 0.3s ease",
                display: "inline-block",
              },
              target: "_blank",
              onMouseEnter: (e) => {
                e.target.style.boxShadow =
                  "0 0 25px rgba(223, 4, 113, 0.8), 0 0 50px rgba(255, 0, 255, 0.5)";
                e.target.style.transform = "translateY(-2px)";
                e.target.style.textShadow =
                  "0 0 15px var(--glow-pink), 0 0 30px var(--glow-pink)";
              },
              onMouseLeave: (e) => {
                e.target.style.boxShadow = "0 0 15px rgba(223, 4, 113, 0.5)";
                e.target.style.transform = "translateY(0)";
                e.target.style.textShadow = "0 0 8px var(--glow-pink)";
              },
            },
            "🤖 BambiSleep.Chat - AI Hypnotic Girlfriend • Mind Control • Programming • Transformation • NSFW"
          ),
          React.createElement(
            "a",
            {
              href: "https://bambisleep.church",
              style: {
                color: "#ffffff",
                textDecoration: "none",
                fontSize: "0.85rem",
                fontWeight: "bold",
                padding: "0.75rem 1.5rem",
                background:
                  "linear-gradient(135deg, rgba(138, 43, 226, 0.3), rgba(64, 0, 47, 0.3))",
                border: "2px solid var(--glow-purple)",
                borderRadius: "12px",
                boxShadow: "0 0 15px rgba(138, 43, 226, 0.5)",
                textShadow: "0 0 8px var(--glow-purple)",
                transition: "all 0.3s ease",
                display: "inline-block",
              },
              target: "_blank",
              onMouseEnter: (e) => {
                e.target.style.boxShadow =
                  "0 0 25px rgba(138, 43, 226, 0.8), 0 0 50px rgba(138, 43, 226, 0.5)";
                e.target.style.transform = "translateY(-2px)";
                e.target.style.textShadow =
                  "0 0 15px var(--glow-purple), 0 0 30px var(--glow-purple)";
              },
              onMouseLeave: (e) => {
                e.target.style.boxShadow = "0 0 15px rgba(138, 43, 226, 0.5)";
                e.target.style.transform = "translateY(0)";
                e.target.style.textShadow = "0 0 8px var(--glow-purple)";
              },
            },
            "⛪ BambiSleep.Church - Digital Sanctuary"
          )
        )
      )
    ),

    // Built with credit - bottom right corner
    React.createElement(
      "div",
      {
        style: {
          position: "fixed",
          bottom: "10px",
          right: "10px",
          padding: "0.5rem 0.75rem",
          background: "rgba(0, 0, 0, 0.5)",
          borderRadius: "8px",
          border: "1px solid rgba(255, 215, 0, 0.3)",
          boxShadow: "0 0 15px rgba(255, 140, 0, 0.3)",
          backdropFilter: "blur(10px)",
          fontSize: "0.7rem",
          zIndex: 1000,
        },
      },
      React.createElement(
        "p",
        {
          style: {
            margin: 0,
            color: "#FFD700",
            textShadow: "0 0 8px #FF8C00",
            fontWeight: "bold",
          },
        },
        "💖 Built with ❤️ by ",
        React.createElement(
          "a",
          {
            href: "https://github.com/HarleyVader",
            style: {
              color: "var(--glow-pink)",
              textDecoration: "none",
              fontWeight: "bold",
              textShadow: "0 0 5px var(--glow-pink)",
            },
            target: "_blank",
          },
          "HarleyVader"
        )
      )
    )
  );
}
