import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import FileReferenceBlock from './FileReferenceBlock.jsx'

const apiClientMock = vi.hoisted(() => ({
  apiRequest: vi.fn(),
  triggerBlobDownload: vi.fn(),
}))

vi.mock('../../../../../shared/api/apiClient.js', () => ({
  apiRequest: (...args) => apiClientMock.apiRequest(...args),
  triggerBlobDownload: (...args) => apiClientMock.triggerBlobDownload(...args),
}))

vi.mock('../../../../auth/context/AuthContext.jsx', () => ({
  useAuth: () => ({ accessToken: 'token-1' }),
}))

describe('FileReferenceBlock', () => {
  beforeEach(() => {
    apiClientMock.apiRequest.mockReset()
    apiClientMock.triggerBlobDownload.mockReset()
  })

  it('downloads the referenced file with the current access token', async () => {
    const user = userEvent.setup()
    const blob = new Blob(['file'])
    apiClientMock.apiRequest.mockResolvedValue(blob)

    render(
      <MemoryRouter>
        <FileReferenceBlock
          block={{
            type: 'FILE_REFERENCE',
            title: 'brief.pdf',
            entityId: 'file-1',
            href: '/workspace?file=file-1',
          }}
        />
      </MemoryRouter>,
    )

    await user.click(screen.getByRole('button', { name: 'Baixar arquivo' }))

    expect(apiClientMock.apiRequest).toHaveBeenCalledWith('/api/files/file-1/download', {
      token: 'token-1',
      responseType: 'blob',
    })
    expect(apiClientMock.triggerBlobDownload).toHaveBeenCalledWith(blob, 'brief.pdf')
  })
})
