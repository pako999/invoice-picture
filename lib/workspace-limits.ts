/** The owner occupies one seat. Excess members lose access after a downgrade. */
export function memberHasSeat(actorId:string, ownerId:string, orderedActiveMemberIds:string[], userLimit:number) {
  return actorId===ownerId || orderedActiveMemberIds.slice(0,Math.max(0,userLimit-1)).includes(actorId);
}
