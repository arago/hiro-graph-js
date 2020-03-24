export declare namespace OGIT {
  export interface SafeNode {
    'ogit/_id': string;
    'ogit/_type': string;
    'ogit/_modified-on': number;
    'ogit/_modified-by': string;
    'ogit/_creator': string;
    'ogit/_created-on': number;
    'ogit/_is-deleted': boolean;
    'ogit/_graphtype': string;
    'ogit/_xid': string;
    'ogit/_organization'?: string;
    'ogit/_scope'?: string;
  }

  export interface Node extends SafeNode {
    [key: string]: string | number | boolean | undefined;
  }

  export interface Edge extends SafeNode {
    'ogit/_edge-id': string;
    'ogit/_in-type': string;
    'ogit/_out-id': string;
    'ogit/_out-type': string;
    'ogit/_in-id': string;
  }

  export namespace Automation {
    export interface AutomationIssue extends SafeNode {
      'ogit/_creator-app'?: string;
      'ogit/_modified-by-app'?: string;
      'ogit/_owner'?: string;
      'ogit/_v'?: number;
      'ogit/_v-id'?: string;
      'ogit/subject'?: string;
      'ogit/status'?: string;
      'ogit/Automation/processingNode'?: string;
      'ogit/Automation/originNode'?: string;
    }
    export interface KnowledgeItem extends SafeNode {
      'ogit/Automation/knowledgeItemFormalRepresentation': string;
      'ogit/_creator-app'?: string;
      'ogit/_modified-by-app'?: string;
      'ogit/_owner'?: string;
      'ogit/_v'?: number;
      'ogit/_v-id'?: string;
      'ogit/description'?: string;
      'ogit/isValid'?: string;
      'ogit/name'?: string;
    }
    export interface KnowledgePool extends SafeNode {
      'ogit/_creator-app'?: string;
      'ogit/_modified-by-app'?: string;
      'ogit/_owner'?: string;
      'ogit/_v'?: number;
      'ogit/_v-id'?: string;
      'ogit/name'?: string;
    }
  }

  export namespace Knowledge {
    export interface AcquisitionSession extends SafeNode {
      'ogit/_creator-app'?: string;
      'ogit/_modified-by-app'?: string;
      'ogit/_owner'?: string;
      'ogit/_v'?: number;
      'ogit/_v-id'?: string;
      'ogit/title'?: string;
      'ogit/_organization'?: string;
      'ogit/_scope'?: string;
      '/teaching_issue_subject'?: string;
      '/teaching_is_handedover'?: string;
      '/teaching_step_progress'?: string;
      '/teaching_ki_progress'?: string;
      '/teaching_ownerId'?: string;
      '/teaching_conversion_ownerId'?: string;
      '/teaching_rooms'?: string;
      '/teaching_rooms_completed'?: string;
      '/teaching_steps'?: string;
      '/teaching_steps_deployed'?: string;
      'ogit/Knowledge/archived'?: string;
    }
  }

  export namespace Auth {
    export interface Account extends SafeNode {
      'ogit/_creator-app'?: string;
      'ogit/_modified-by-app'?: string;
      'ogit/_owner'?: string;
      'ogit/_v'?: number;
      'ogit/_v-id'?: string;
      'ogit/name'?: string;
      'ogit/status'?: string;
      'ogit/email'?: string;
    }

    export interface AccountProfile extends SafeNode {
      'ogit/_creator-app'?: string;
      'ogit/_modified-by-app'?: string;
      'ogit/_owner'?: string;
      'ogit/_v'?: number;
      'ogit/_v-id'?: string;
      'ogit/_organization'?: string;
      'ogit/_scope'?: string;
      'ogit/Auth/Account/acceptedEmails'?: string; // timestamp
      'ogit/Auth/Account/displayName'?: string;
      'ogit/firstName'?: string;
      'ogit/lastName'?: string;
      '/jobRole'?: string;
      '/profileSet'?: string;
    }

    export interface Application extends SafeNode {
      'ogit/name': string;
      'ogit/description': string;
      'ogit/Auth/vertexRule': string;
      'ogit/Auth/edgeRule': string;
    }

    export interface Role extends SafeNode {
      'ogit/name': string;
      'ogit/description'?: string;
      'ogit/Auth/vertexRule': string;
      'ogit/Auth/edgeRule': string;
    }

    export interface Team extends SafeNode {
      'ogit/name': string;
      'ogit/description'?: string;
    }

    export interface DataScope extends SafeNode {
      'ogit/name': string;
      'ogit/description'?: string;
    }

    export interface Organization extends SafeNode {
      'ogit/name'?: string;
    }
  }
}
