// The club is in New York, so "today" and event times use Eastern time.
const TIME_ZONE = "America/New_York";

// Event start times are stored as local wall-clock strings like
// "2026-10-12T09:00" (no time zone). Returns a comparable/sortable key.
function eventKey(value) {
  if (value instanceof Date) return value.toISOString().slice(0, 16);
  return String(value ?? "").trim().replace(" ", "T");
}

// Today's date in the club's time zone, as "YYYY-MM-DD".
function todayInClubTimeZone() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE }).format(new Date());
}

export default function (eleventyConfig) {
  // Static assets are copied to the output folder unchanged.
  eleventyConfig.addPassthroughCopy("src/style.css");
  eleventyConfig.addPassthroughCopy("src/images");
  eleventyConfig.addPassthroughCopy("src/docs");
  eleventyConfig.addPassthroughCopy("src/media"); // uploads from Pages CMS
  eleventyConfig.addPassthroughCopy("src/CNAME");

  // Events on or after today, soonest first. Past events drop off at the
  // next build; the deploy workflow rebuilds nightly for this reason.
  eleventyConfig.addFilter("upcomingEvents", (events = []) => {
    const today = todayInClubTimeZone();
    return events
      .filter((event) => eventKey(event.data.start).slice(0, 10) >= today)
      .sort((a, b) => eventKey(a.data.start).localeCompare(eventKey(b.data.start)));
  });

  // "2026-10-12T09:00" -> "Monday, October 12, 2026 · 9:00 AM"
  eleventyConfig.addFilter("eventDate", (value) => {
    const [datePart, timePart] = eventKey(value).split("T");
    const [y, m, d] = datePart.split("-").map(Number);
    const [hh, mm] = (timePart || "").split(":").map(Number);
    const hasTime = Number.isFinite(hh);
    // Build in UTC and format in UTC so the wall-clock time is shown as entered.
    const date = new Date(Date.UTC(y, m - 1, d, hasTime ? hh : 0, hasTime ? mm || 0 : 0));
    const day = date.toLocaleDateString("en-US", {
      timeZone: "UTC", weekday: "long", month: "long", day: "numeric", year: "numeric",
    });
    if (!hasTime) return day;
    const time = date.toLocaleTimeString("en-US", { timeZone: "UTC", hour: "numeric", minute: "2-digit" });
    return `${day} · ${time}`;
  });
}

export const config = {
  dir: {
    input: "src",
    output: "_site",
    includes: "_includes",
    data: "_data",
  },
  templateFormats: ["html", "njk", "md"],
  htmlTemplateEngine: "njk",
  markdownTemplateEngine: "njk",
};
