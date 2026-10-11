export function isAdministrator(verifiedUserId: string | undefined, verifiedRole: unknown) {
  return Boolean(verifiedUserId) && verifiedRole === true;
}
export function ownsConversation(userId: string, conversationUserId: string) {
  return userId === conversationUserId;
}