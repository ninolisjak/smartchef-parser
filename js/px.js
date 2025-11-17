function Px(text) {
  this.text = text;

  // read VALUES("NAME")
  this.values = function (name) {
    const re = new RegExp('VALUES\\("' + name + '"\\)=([^;]+);', "s");
    const match = this.text.match(re);
    if (!match) return [];

    return match[1]
      .replace(/\r/g, "")
      .replace(/\n/g, "")
      .split(",")
      .map(s => s.replace(/"/g, "").trim())
      .filter(Boolean);
  };

  // read DATA section and convert to numeric 2D array
  this.getData = function () {
    const match = this.text.match(/DATA=\s*([^;]+);/s);
    if (!match) return [];

    let raw = match[1]
      .replace(/"[^"]*"/g, "")   // remove ".." , "N" etc
      .replace(/\r/g, "")
      .replace(/\n/g, " ");

    const nums = raw
      .split(/\s+/)
      .map(x => x.trim())
      .filter(x => x.length > 0)
      .map(x => Number(x.replace(",", ".")))
      .filter(x => !isNaN(x));

    // Your PX has 72 LETO x 2 INDEKSI = 144 values
    const years = this.values("LETO").length;
    const indices = this.values("INDEKSI").length;

    const matrix = [];

    for (let y = 0; y < years; y++) {
      matrix[y] = [];
      for (let i = 0; i < indices; i++) {
        matrix[y][i] = nums[y * indices + i];
      }
    }

    return matrix;
  };
}
