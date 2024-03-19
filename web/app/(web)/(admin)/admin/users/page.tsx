import PageHeader from 'lib/components/page-header/PageHeader'
import UsersClientPage from 'lib/components/user/UsersClientPage'
import { getUsers } from 'lib/data/users'
import { serializeUsers } from 'lib/types/user'

export const dynamic = 'force-dynamic'

export default async function UsersPage() {
  const users = await getUsers()
  const sUsers = serializeUsers(users)
  return (
    <>
      <PageHeader title={'Správa uživatelů'} isFluid={false} />
      <UsersClientPage sUsers={sUsers} />
    </>
  )
}
