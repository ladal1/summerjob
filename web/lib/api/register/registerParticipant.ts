import {
  getPostsParticipants,
  updatePostParticipantById,
} from 'lib/data/participants'
import { ExtendedSession } from 'lib/types/auth'

export const registerParticipant = async (
  participantId: string,
  postId: string,
  session: ExtendedSession
) => {
  await updatePostParticipantById(participantId, postId)
}
