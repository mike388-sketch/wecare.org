import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) {
  console.error("Missing MONGODB_URI in environment.");
  process.exit(1);
}

const shouldApply = process.argv.includes("--apply");
const shouldCleanup = process.argv.includes("--cleanup");

async function getCounts(collection) {
  const needsStream = await collection.countDocuments({
    $and: [
      { $or: [{ stream: { $exists: false } }, { stream: null }, { stream: "" }] },
      { className: { $exists: true, $ne: null, $ne: "" } }
    ]
  });

  const needsMedicalIssues = await collection.countDocuments({
    $and: [
      { $or: [{ medicalIssues: { $exists: false } }, { medicalIssues: { $eq: [] } }] },
      {
        $or: [
          { allergies: { $exists: true, $ne: [] } },
          { chronicConditions: { $exists: true, $ne: [] } }
        ]
      }
    ]
  });

  return { needsStream, needsMedicalIssues };
}

async function main() {
  await mongoose.connect(mongoUri);
  const collection = mongoose.connection.db.collection("students");

  if (!shouldApply) {
    const counts = await getCounts(collection);
    console.log("Dry run only. No changes applied.");
    console.log(`Students missing stream (but have className): ${counts.needsStream}`);
    console.log(`Students missing medicalIssues (but have legacy issues): ${counts.needsMedicalIssues}`);
    await mongoose.disconnect();
    return;
  }

  const pipeline = [
    {
      $set: {
        stream: {
          $cond: [
            {
              $and: [
                { $or: [{ $eq: ["$stream", null] }, { $eq: ["$stream", ""] }] },
                { $gt: [{ $strLenCP: { $ifNull: ["$className", ""] } }, 0] }
              ]
            },
            "$className",
            "$stream"
          ]
        },
        medicalIssues: {
          $cond: [
            { $gt: [{ $size: { $ifNull: ["$medicalIssues", []] } }, 0] },
            "$medicalIssues",
            {
              $setUnion: [
                { $ifNull: ["$allergies", []] },
                { $ifNull: ["$chronicConditions", []] }
              ]
            }
          ]
        }
      }
    }
  ];

  if (shouldCleanup) {
    pipeline.push({
      $unset: [
        "className",
        "allergies",
        "chronicConditions",
        "medications",
        "emergencyContact",
        "gender"
      ]
    });
  }

  const result = await collection.updateMany({}, pipeline);
  console.log(`Migration complete. Matched: ${result.matchedCount}, Modified: ${result.modifiedCount}`);

  await mongoose.disconnect();
}

main().catch((error) => {
  console.error("Migration failed.");
  console.error(error);
  mongoose.disconnect().finally(() => process.exit(1));
});
