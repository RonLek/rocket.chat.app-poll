import { IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { RocketChatAssociationModel, RocketChatAssociationRecord } from '@rocket.chat/apps-engine/definition/metadata';

import { IPoll } from '../definition';
import { createLivePollMessage } from './createLivePollMessage';
import { createPollBlocks } from './createPollBlocks';
import { getPoll } from './getPoll';

async function finishPoll(poll: IPoll, { persis }: { persis: IPersistence }) {
    const association = new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, poll.msgId);
    poll.finished = true;
    return persis.updateByAssociation(association, poll);
}

export async function nextPollMessage({ data, read, persistence, modify }: {
    data,
    read: IRead,
    persistence: IPersistence,
    modify: IModify,
}) {
    if (!data.message) {
        return {
            success: true,
        };
    }

    console.log("Within nextPoll Message");

    const poll = await getPoll(String(data.message.id), read);

    if (!poll) {
        throw new Error('no such poll');
    }

    if (poll.finished) {
        throw new Error('this poll is already finished');
    }

    if (poll.uid !== data.user.id) {
        throw new Error('You are not allowed to activate the next poll'); // send an ephemeral message
    }

    try {

        // Mark poll as inactive
        poll.activeLivePoll = false
        // Finish poll if not finished
        if(!poll.finished)
        {
            await finishPoll(poll, { persis: persistence });
        }

        const message = await modify.getUpdater().message(data.message.id as string, data.user);
        message.setEditor(message.getSender());

        const block = modify.getCreator().getBlockBuilder();

        const showNames = await read.getEnvironmentReader().getSettings().getById('use-user-name');

        createPollBlocks(block, poll.question, poll.options, poll, showNames.value);

        message.setBlocks(block);

        // End poll and send next poll
        if(poll.pollIndex!=undefined && poll.totalLivePolls && poll.pollIndex < poll.totalLivePolls) {
            // Send updated message
            modify.getUpdater().finish(message);
            // Create next poll
            data.view = {id: poll.liveId}
            await createLivePollMessage(data, read, modify, persistence, data.user.id, poll.pollIndex + 1);
        } else {

        // Finish current poll
        return modify.getUpdater().finish(message);
        }        
    } catch (e) {
        console.error('Error', e);
    }
}