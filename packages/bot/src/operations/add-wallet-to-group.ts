import { Account, Group, prismaClient, Wallet } from '@microcosms/db'
import bot from '../bot'
import { LogContext } from '../utils'

export const addWalletToGroup = async ({
  wallet,
  group,
  account,
  cl,
}: {
  wallet: Wallet
  group: Group
  account: Account
  cl: LogContext
}) => {
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 2) // 2 days
  let inviteLinkExisting = await prismaClient().groupMemberInviteLink.findFirst(
    {
      where: {
        consumedAt: null,
        groupMember: {
          account: {
            id: account.id,
          },
          group: {
            id: group.id,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    }
  )
  // inviteLinkExisting = null
  // const inviteLinkExisting: { inviteLink: string } | null = null
  let inviteLink: string | null = null
  if (inviteLinkExisting) {
    inviteLink = inviteLinkExisting.inviteLink
  } else {
    // create a fresh invite link here for the user
    const link = await bot.api.createChatInviteLink(group.groupId.toString(), {
      creates_join_request: false,
      expire_date: Math.floor(expiresAt.getTime() / 1000),
      member_limit: 1,
    })
    inviteLink = link.invite_link
    const isAdmin = prismaClient().groupAdmin.findFirst({
      where: {
        group: {
          id: group.id,
        },
        account: {
          id: account.id,
        },
      },
    })
    if (!isAdmin) {
      try {
        await bot.api.unbanChatMember(
          group.groupId.toString(),
          Number(account.userId)
        )
      } catch (e) {
        //
        cl.error("Couldn't unban user", e)
      }
    }
  }

  // create a fresh invite link here for the user
  // store in the db
  //the user will be added with chat_members callback when they actually join

  return {
    expiresAt,
    inviteLink,
    groupMember: await prismaClient().groupMember.upsert({
      where: {
        GroupMember_accountId_groupId_unique: {
          accountId: account.id,
          groupId: group.id,
        },
      },
      create: {
        //save it as inactive until they actually join
        active: false,
        group: {
          connect: {
            id: group.id,
          },
        },
        account: {
          connect: {
            id: account.id,
          },
        },
        groupMemberInviteLink: {
          connectOrCreate: {
            where: {
              inviteLink,
            },
            create: {
              inviteLink,
              expiresAt,
            },
          },
        },
      },
      update: {
        //leave it as whatever active state until they actually join they will be added again
        groupMemberInviteLink: {
          connectOrCreate: {
            where: {
              inviteLink,
            },
            create: {
              inviteLink,
              expiresAt,
            },
          },
        },
      },
    }),
  }
}
