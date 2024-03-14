import { BSP } from "./scripts/bsp-parser.js";
import { findSeamshots } from "./scripts/seamshot-finder.js";
import { findCheeseshots } from "./scripts/cheeseshot-finder.js";

// converts seamshot array into a drawline commands string, then requests download.
async function outputSeamshotsIntoFile(
  seamshots: any[],
  filename: string,
  command = "script",
) {
  let output = "";

  switch (command) {
    case "sar_drawline":
      for (const seamshot of seamshots) {
        output += "sar_drawline " +
          seamshot.point1.x + " " + seamshot.point1.y + " " +
          seamshot.point1.z + " " +
          seamshot.point2.x + " " + seamshot.point2.y + " " +
          seamshot.point2.z + " " +
          (seamshot.planenum > 1
            ? "0 255 0"
            : (seamshot.type == 0 ? "255 150 0" : "255 0 0")) +
          "\n";
      }
      break;
    case "script":
      output =
        'script printl("Bind this config to a key for it to work (bind <key> \\"exec seams_mapname\\")")\n';
      output +=
        'script printl("The drawn lines can be turned off with the clear_debug_overlays command ' +
        'and will turn off automatically after 1000 seconds")\n';
      output +=
        "script function _l(x1,y1,z1,x2,y2,z2,r){DebugDrawLine(Vector(x1,y1,z1),Vector(x2,y2,z2),r,255-r,0,true,1000)}\n";
      for (const seamshot of seamshots) {
        output += "script _l(" +
          seamshot.point1.x + "," + seamshot.point1.y + "," +
          seamshot.point1.z + "," +
          seamshot.point2.x + "," + seamshot.point2.y + "," +
          seamshot.point2.z + "," +
          (seamshot.planenum > 1 ? "0" : (seamshot.type == 0 ? "150" : "255")) +
          ")\n";
      }
      break;
  }

  await Deno.writeTextFile(filename, output);
  console.log("written", filename);
}

// converts seamshot array into a drawline commands string, then requests download.
async function outputSeamshotsIntoFileCheese(
  seamshots: any[],
  filename: string,
  command = "script",
) {
  let output = "";

  switch (command) {
    case "sar_drawline":
      for (let seamshot of seamshots) {
        output += "sar_drawline " +
          seamshot.point1.x + " " + seamshot.point1.y + " " +
          seamshot.point1.z + " " +
          seamshot.point2.x + " " + seamshot.point2.y + " " +
          seamshot.point2.z + " " +
          (seamshot.delta > 0 ? "0 255 0" : "255 0 0") +
          "\n";

        output += "sar_drawline " +
          seamshot.point1.x + " " + seamshot.point1.y + " " +
          seamshot.point1.z + " " +
          (seamshot.point1.x - seamshot.normal.x) + " " +
          (seamshot.point1.y - seamshot.normal.y) + " " +
          (seamshot.point1.z - seamshot.normal.z) + " " +
          (seamshot.delta > 0 ? "0 255 0" : "255 0 0") +
          "\n";

        output += "sar_drawline " +
          seamshot.point2.x + " " + seamshot.point2.y + " " +
          seamshot.point2.z + " " +
          (seamshot.point2.x - seamshot.normal.x) + " " +
          (seamshot.point2.y - seamshot.normal.y) + " " +
          (seamshot.point2.z - seamshot.normal.z) + " " +
          (seamshot.delta > 0 ? "0 255 0" : "255 0 0") +
          "\n";
      }
      break;
    case "script":
      output =
        'script printl("Bind this config to a key for it to work (bind <key> \\"exec seams_mapname\\")")\n';
      output +=
        'script printl("The drawn lines can be turned off with the clear_debug_overlays command ' +
        'and will turn off automatically after 1000 seconds")\n';
      output +=
        "script function _l(x1,y1,z1,x2,y2,z2,r){DebugDrawLine(Vector(x1,y1,z1),Vector(x2,y2,z2),r,255-r,0,true,1000)}\n";
      for (const seamshot of seamshots) {
        output += "script _l(" +
          seamshot.point1.x + "," + seamshot.point1.y + "," +
          seamshot.point1.z + "," +
          seamshot.point2.x + "," + seamshot.point2.y + "," +
          seamshot.point2.z + "," +
          (seamshot.delta > 0 ? "0" : (seamshot.type == 0 ? "150" : "255")) +
          ")\n";

        output += "script _l(" +
          seamshot.point1.x + "," + seamshot.point1.y + "," +
          seamshot.point1.z + "," +
          (seamshot.point1.x - seamshot.normal.x) + "," +
          (seamshot.point1.y - seamshot.normal.y) + "," +
          (seamshot.point1.z - seamshot.normal.z) + "," +
          (seamshot.delta > 0 ? "0" : (seamshot.type == 0 ? "150" : "255")) +
          ")\n";

        output += "script _l(" +
          seamshot.point1.x + "," + seamshot.point1.y + "," +
          seamshot.point1.z + "," +
          (seamshot.point2.x - seamshot.normal.x) + "," +
          (seamshot.point2.y - seamshot.normal.y) + "," +
          (seamshot.point2.z - seamshot.normal.z) + "," +
          (seamshot.delta > 0 ? "0" : (seamshot.type == 0 ? "150" : "255")) +
          ")\n";
      }
      break;
  }

  await Deno.writeTextFile(filename, output);
  console.log("written", filename);
}

async function outputSeamshotsIntoPortalFileCheese(
  seamshots: any[],
  filename: string,
) {
  let output = "PRT1\n" + "0\n" + seamshots.length + "\n";

  for (let seamshot of seamshots) {
    output += "4 0 0 (" +
      seamshot.point1.x + " " + seamshot.point1.y + " " + seamshot.point1.z +
      ") (" +
      seamshot.point2.x + " " + seamshot.point2.y + " " + seamshot.point2.z +
      ") (" +
      (seamshot.point2.x - seamshot.normal.x) + " " +
      (seamshot.point2.y - seamshot.normal.y) + " " +
      (seamshot.point2.z - seamshot.normal.z) + ") (" +
      (seamshot.point1.x - seamshot.normal.x) + " " +
      (seamshot.point1.y - seamshot.normal.y) + " " +
      (seamshot.point1.z - seamshot.normal.z) + ")" +
      "\n";
  }

  await Deno.writeTextFile(filename, output);
  console.log("written", filename);
}

const folder =
  "/home/nekz/.steam/steam/steamapps/common/Portal Revolution/revolution/maps/";

for await (const file of Deno.readDir(folder)) {
  if (file.isFile && file.name.endsWith(".bsp")) {
    const data = await Deno.readFile(folder + file.name);
    const map = BSP.parseMap(data);
    const seams = findSeamshots(map);
    const cheeses = findCheeseshots(map);

    await outputSeamshotsIntoFile(
      seams,
      "seams_" + file.name.replace(".bsp", ".cfg"),
    );
    await outputSeamshotsIntoFileCheese(
      cheeses,
      "seams_" + file.name.replace(".bsp", "_cheese.cfg"),
    );
    await outputSeamshotsIntoPortalFileCheese(
      cheeses,
      "seams_" + file.name.replace(".bsp", "_cheese.prt"),
    );
  }
}
