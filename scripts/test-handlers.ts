import "dotenv/config";
import * as eventsController from "../src/controllers/events.controller";

console.log("Controller exports:", Object.keys(eventsController));
console.log("");
console.log("generateSeriesForAttendee:", typeof eventsController.generateSeriesForAttendee);
console.log("getSeries:", typeof eventsController.getSeries);
console.log("getAttendeeSeries:", typeof eventsController.getAttendeeSeries);
console.log("list:", typeof eventsController.list);
console.log("getById:", typeof eventsController.getById);
console.log("getAttendees:", typeof eventsController.getAttendees);
console.log("previewSequence:", typeof eventsController.previewSequence);
console.log("resyncAttendees:", typeof eventsController.resyncAttendees);
