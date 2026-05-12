declare module "africastalking" {
  interface AfricasTalkingOptions {
    apiKey: string;
    username: string;
  }

  interface SMSSendOptions {
    to: string[];
    message: string;
    from?: string;
  }

  interface SMSRecipient {
    status: string;
    messageId: string;
    number: string;
    cost: string;
  }

  interface SMSSendResponse {
    SMSMessageData: {
      Message: string;
      Recipients: SMSRecipient[];
    };
  }

  interface SMSService {
    send(options: SMSSendOptions): Promise<SMSSendResponse>;
  }

  interface AfricasTalkingInstance {
    SMS: SMSService;
  }

  function AfricasTalking(options: AfricasTalkingOptions): AfricasTalkingInstance;

  export = AfricasTalking;
}
