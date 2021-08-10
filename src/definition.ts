import { IUIKitBlockIncomingInteraction } from '@rocket.chat/apps-engine/definition/uikit/UIKitIncomingInteractionTypes';
import { IUser } from '@rocket.chat/apps-engine/definition/users';

export type IVoterPerson = Pick<IUser, 'id' | 'username' | 'name'>;

export interface IVoter {
    quantity: number;
    voters: Array<IVoterPerson>;
}

export interface IPoll {
    msgId: string;
    uid: string; // user who created the poll
    question: string;
    options: Array<string>;
    totalVotes: number;
    votes: Array<IVoter>;
    finished?: boolean;
    confidential?: boolean;
    singleChoice?: boolean;
    liveId?: string;
    pollIndex?: number;
    totalLivePolls?: number;
    activeLivePoll?: boolean;
    livePollEndTime?: string
}

export interface IModalContext extends Partial<IUIKitBlockIncomingInteraction> {
    threadId?: string;
}
