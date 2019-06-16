import Status from "./Status";

export default class ResponseMsg {

    message: string;
    code: Status;

    constructor(message: string, status: Status = Status.denied) {
        this.message = message;
        this.code = status;
    }

}