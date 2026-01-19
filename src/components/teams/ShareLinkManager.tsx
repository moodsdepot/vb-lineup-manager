'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Trash2, Link, Clock, Users } from 'lucide-react';
import type { ShareLinkRole, ShareLinkCreateResponse } from '@/types/lineup-state';

interface ShareLink {
  id: string;
  role: ShareLinkRole;
  expires_at: string | null;
  revoked_at: string | null;
  max_uses: number | null;
  use_count: number;
  created_at: string;
}

interface ShareLinkManagerProps {
  teamId: string;
}

export default function ShareLinkManager({ teamId }: ShareLinkManagerProps) {
  const [shareLinks, setShareLinks] = useState<ShareLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newLink, setNewLink] = useState<ShareLinkCreateResponse | null>(null);
  const [role, setRole] = useState<ShareLinkRole>('viewer');
  const [copied, setCopied] = useState(false);

  const fetchShareLinks = useCallback(async () => {
    try {
      const response = await fetch(`/api/teams/${teamId}/share-links`);
      if (response.ok) {
        const data = await response.json();
        setShareLinks(data.share_links || []);
      }
    } catch (error) {
      console.error('Error fetching share links:', error);
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  useEffect(() => {
    fetchShareLinks();
  }, [fetchShareLinks]);

  const createShareLink = async () => {
    setCreating(true);
    try {
      const response = await fetch(`/api/teams/${teamId}/share-links`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });

      if (response.ok) {
        const data: ShareLinkCreateResponse = await response.json();
        setNewLink(data);
        fetchShareLinks();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to create share link');
      }
    } catch (error) {
      console.error('Error creating share link:', error);
      alert('Failed to create share link');
    } finally {
      setCreating(false);
    }
  };

  const revokeShareLink = async (linkId: string) => {
    if (!confirm('Are you sure you want to revoke this share link?')) return;

    try {
      const response = await fetch(`/api/teams/${teamId}/share-links/${linkId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ revoked_at: new Date().toISOString() }),
      });

      if (response.ok) {
        fetchShareLinks();
      }
    } catch (error) {
      console.error('Error revoking share link:', error);
    }
  };

  const copyToClipboard = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return <div className="text-gray-400 text-sm">Loading share links...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Share Links</h3>
      </div>

      {/* Create new link */}
      <div className="bg-gray-800 rounded-lg p-4 space-y-3">
        <div className="flex items-center gap-3">
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as ShareLinkRole)}
            className="bg-gray-700 text-white rounded px-3 py-2 text-sm"
          >
            <option value="viewer">Viewer (view only)</option>
            <option value="editor">Editor (can edit)</option>
          </select>
          <Button
            onClick={createShareLink}
            disabled={creating}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Link className="w-4 h-4 mr-2" />
            {creating ? 'Creating...' : 'Create Link'}
          </Button>
        </div>

        {/* Newly created link */}
        {newLink && (
          <div className="bg-green-900/30 border border-green-600 rounded-lg p-3">
            <p className="text-green-400 text-sm font-medium mb-2">
              Share link created! Copy it now - it won&apos;t be shown again.
            </p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={newLink.share_url}
                className="flex-1 bg-gray-900 text-white text-sm px-3 py-2 rounded"
              />
              <Button
                onClick={() => copyToClipboard(newLink.share_url)}
                size="sm"
                variant="outline"
              >
                <Copy className="w-4 h-4 mr-1" />
                {copied ? 'Copied!' : 'Copy'}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Existing links */}
      <div className="space-y-2">
        {shareLinks.length === 0 ? (
          <p className="text-gray-400 text-sm">No share links created yet.</p>
        ) : (
          shareLinks.map((link) => (
            <div
              key={link.id}
              className={`bg-gray-800 rounded-lg p-3 flex items-center justify-between ${
                link.revoked_at ? 'opacity-50' : ''
              }`}
            >
              <div className="flex items-center gap-4">
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    link.role === 'editor'
                      ? 'bg-orange-600 text-white'
                      : 'bg-gray-600 text-white'
                  }`}
                >
                  {link.role}
                </span>

                <div className="flex items-center gap-3 text-sm text-gray-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDate(link.created_at)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {link.use_count} uses
                  </span>
                </div>

                {link.revoked_at && (
                  <span className="text-red-400 text-xs">Revoked</span>
                )}
              </div>

              {!link.revoked_at && (
                <Button
                  onClick={() => revokeShareLink(link.id)}
                  size="sm"
                  variant="ghost"
                  className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
