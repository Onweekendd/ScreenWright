/*
  Warnings:

  - You are about to drop the `group_layer` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `group_layer_data` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "group_layer";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "group_layer_data";
PRAGMA foreign_keys=on;
