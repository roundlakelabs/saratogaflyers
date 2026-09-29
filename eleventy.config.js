export default function (eleventyConfig) {
  // Static assets are copied to the output folder unchanged.
  eleventyConfig.addPassthroughCopy("src/style.css");
  eleventyConfig.addPassthroughCopy("src/images");
  eleventyConfig.addPassthroughCopy("src/docs");
  eleventyConfig.addPassthroughCopy("src/media"); // uploads from Pages CMS
  eleventyConfig.addPassthroughCopy("src/CNAME");
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
