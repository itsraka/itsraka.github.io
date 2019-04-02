import {OpenEvent} from "./events"

export interface OpenEventPublisher {
    openEventPublish(event: OpenEvent);
}